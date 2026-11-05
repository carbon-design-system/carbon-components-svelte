// @ts-check
// The bindings between a virtualizer and the elements that scroll it: reading
// where an element is scrolled to, writing where the virtualizer asks it to go,
// following its size, and keeping panes that show one scroll position together.

import { tick } from "svelte";
import { observeResize } from "./shared-observer.js";

/**
 * How one axis of a scroller reads and writes. Along the inline axis a
 * right-to-left scroller counts `scrollLeft` from zero downward, so the
 * distance from the inline start is its negation.
 *
 * @param {HTMLElement} element
 * @param {"x" | "y"} axis
 */
function createAxis(element, axis) {
  const horizontal = axis === "x";
  const isRtl = () =>
    horizontal && getComputedStyle(element).direction === "rtl";

  return {
    /** @returns {number} Distance scrolled from the start of the axis. */
    read() {
      if (!horizontal) return element.scrollTop;
      return isRtl() ? -element.scrollLeft : element.scrollLeft;
    },
    /** @param {number} offset */
    write(offset) {
      if (horizontal) element.scrollLeft = isRtl() ? -offset : offset;
      else element.scrollTop = offset;
    },
    /** @returns {number} The furthest the element scrolls along the axis. */
    max() {
      return horizontal
        ? element.scrollWidth - element.clientWidth
        : element.scrollHeight - element.clientHeight;
    },
    /** @returns {number} How much of the content the element shows. */
    viewport() {
      return horizontal ? element.clientWidth : element.clientHeight;
    },
  };
}

/**
 * Drive a virtualizer from a scrolling element, along one axis.
 *
 * It reports the element's scroll position and size to the virtualizer, and
 * writes the positions the virtualizer asks for. A write waits for the next
 * Svelte flush, since a request that grows the list and scrolls to its new end
 * is made before the spacer that holds that end exists.
 *
 * @param {import("./virtualizer.js").Virtualizer} virtualizer
 * @param {HTMLElement} element The scroll container.
 * @param {Object} [options]
 * @param {"x" | "y"} [options.axis="y"] `"x"` scrolls along the inline axis,
 * mirrored in a right-to-left element.
 * @returns {() => void} Stops following the element.
 */
export function attachScroller(virtualizer, element, { axis = "y" } = {}) {
  const io = createAxis(element, axis);
  /** @type {number | null} */
  let queued = null;
  let attached = true;
  /** The position the scroller was last at, as far as this knows. */
  let applied = io.read();

  function flush() {
    const offset = queued;
    queued = null;
    if (offset === null || !attached) return;

    // The reader may have moved the scroller since the request, in a scroll
    // event not delivered yet. Theirs is the more recent intent: report it,
    // which drops the request, and do not write over it.
    const current = io.read();
    // A scroller that got shorter is not the reader: it clamped the position
    // to its new end.
    const clamped = current < applied && Math.abs(current) >= io.max() - 1;
    if (Math.abs(current - applied) > 1 && !clamped) {
      applied = current;
      virtualizer.setScroll(current);
      return;
    }

    io.write(offset);
    const actual = io.read();
    applied = actual;
    // The scroller clamps to what it can reach.
    if (actual !== offset) virtualizer.syncScroll(actual);
  }

  virtualizer.setOptions({
    viewportSize: io.viewport(),
    scrollTo: (offset) => {
      // A scroller takes whole pixels. A position that rounds down can land
      // just short of the item boundary it was computed from, which starts the
      // window one item early. Round up, so the position taken is never short
      // of the one asked for.
      const snapped = Math.ceil(offset - 1e-6);
      if (queued === null) tick().then(flush);
      queued = snapped;
      return snapped;
    },
  });

  const onScroll = () => {
    applied = io.read();
    virtualizer.setScroll(applied);
  };
  element.addEventListener("scroll", onScroll, { passive: true });
  const stopObserving = observeResize(element, () => {
    virtualizer.setViewport(io.viewport());
  });

  // The element may already be scrolled, which fires no event to catch up with,
  // and the virtualizer may have been told where to start. The element follows
  // a start it was given, since that is the window the first render held.
  const start = virtualizer.getScrollOffset();
  if (start > 0) {
    queued = start;
    tick().then(flush);
  } else {
    applied = io.read();
    virtualizer.syncScroll(applied);
  }

  return () => {
    attached = false;
    element.removeEventListener("scroll", onScroll);
    stopObserving();
  };
}

/**
 * Drive a grid virtualizer from one scrolling element: rows along the block
 * axis, columns along the inline axis.
 *
 * @param {import("./virtualizer.js").GridVirtualizer} grid
 * @param {HTMLElement} element
 * @returns {() => void} Stops following the element.
 */
export function attachGridScroller(grid, element) {
  const stopRows = attachScroller(grid.rows, element, { axis: "y" });
  const stopColumns = attachScroller(grid.columns, element, { axis: "x" });
  return () => {
    stopRows();
    stopColumns();
  };
}

/**
 * Keep scrollers at one scroll position, as two panes of a comparison do.
 * Scrolling one scrolls the rest; the scroll each write causes is not echoed
 * back, so the panes do not chase one another.
 *
 * @param {ReadonlyArray<HTMLElement>} elements
 * @param {Object} [options]
 * @param {"x" | "y" | "both"} [options.axis="y"]
 * @param {(offset: number, from: HTMLElement, to: HTMLElement, axis: "x" | "y") => number} [options.map]
 * Where `to` goes when `from` scrolls to `offset`, for panes whose content
 * differs in length. By default, the same distance.
 * @returns {() => void} Stops syncing.
 */
export function syncScroll(elements, { axis = "y", map } = {}) {
  /** @type {Map<HTMLElement, { top: number, left: number }>} */
  const written = new Map();
  /** @type {Array<() => void>} */
  const stops = [];

  /**
   * @param {HTMLElement} source
   * @param {HTMLElement} target
   * @param {"x" | "y"} along
   */
  function copy(source, target, along) {
    const property = along === "x" ? "scrollLeft" : "scrollTop";
    const next = map
      ? map(source[property], source, target, along)
      : source[property];
    if (target[property] === next) return;
    target[property] = next;
    written.set(target, { top: target.scrollTop, left: target.scrollLeft });
  }

  for (const source of elements) {
    /** @param {Event} _event */
    const onScroll = (_event) => {
      // A scroll the other pane's write caused: not the reader's, so not passed on.
      const echo = written.get(source);
      if (
        echo &&
        (axis === "x" || echo.top === source.scrollTop) &&
        (axis === "y" || echo.left === source.scrollLeft)
      ) {
        written.delete(source);
        return;
      }

      for (const target of elements) {
        if (target === source) continue;
        if (axis !== "x") copy(source, target, "y");
        if (axis !== "y") copy(source, target, "x");
      }
    };
    source.addEventListener("scroll", onScroll, { passive: true });
    stops.push(() => source.removeEventListener("scroll", onScroll));
  }

  return () => {
    for (const stop of stops) stop();
    written.clear();
  };
}
