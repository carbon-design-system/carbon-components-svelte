// @ts-check

/**
 * Attribute a virtualized component stamps on every element in its window,
 * carrying the index of the item it renders. Measured heights are attributed
 * back through it, so nothing here reasons about DOM order. The listbox
 * components emit this name as a literal.
 */
export const VIRTUAL_INDEX_ATTRIBUTE = "data-virtual-index";

/**
 * The height a resize entry reports. Offsets need `borderBoxSize`, since an
 * option's padding and border occupy scroll height too. `contentRect` is the
 * fallback for environments that leave `borderBoxSize` empty.
 *
 * @param {ResizeObserverEntry} entry
 * @returns {number}
 */
function readEntryHeight(entry) {
  const borderBox = entry.borderBoxSize?.[0];
  return borderBox ? borderBox.blockSize : entry.contentRect.height;
}

/**
 * @param {Element} element
 * @returns {number} The item index the element renders, or `-1` when it
 * carries no usable one.
 */
function readIndex(element) {
  const raw = element.getAttribute(VIRTUAL_INDEX_ATTRIBUTE);
  if (raw === null || raw === "") return -1;
  const index = Number(raw);
  return Number.isInteger(index) && index >= 0 ? index : -1;
}

/**
 * Track the heights the elements of a virtualized window render at, so
 * measured virtualization has real heights to place offsets from.
 *
 * All height reading lives here, which keeps `virtualize.js` pure: this reports
 * heights, that turns them into positions. Scroll position belongs to
 * `menuWindow.js`, which owns the container element.
 *
 * Reports are an array indexed by item, sparse where unmeasured, matching the
 * shape `virtualize.js` takes as `heights`. They carry the heights they replace
 * so a caller can work out how far the options above the viewport moved.
 *
 * One observer covers the whole window rather than one per element. Besides
 * being cheaper, it catches height changes no render pass would reveal: a web
 * font swapping in, a container resize, or the reader changing browser zoom
 * with the window still on screen.
 *
 * A batch is held until the next animation frame rather than reported from
 * inside the observer's callback. Acting on heights moves the window, since the
 * caller corrects the scroll position and re-resolves which options render.
 * Doing that during a delivery both scrolls the container and observes the
 * newly rendered options, leaving observations the browser cannot deliver in
 * that pass. It then reports `ResizeObserver loop completed with undelivered
 * notifications` as an uncatchable window error, on every scroll of a measured
 * menu. Waiting for the frame also coalesces the batches one scroll arrives in,
 * so offsets accumulate once for all of them.
 *
 * @param {Object} options
 * @param {(heights: number[], previousHeights: number[]) => void} options.onMeasure
 * Called on the animation frame after a report that differs from the heights
 * already held.
 * @returns {{
 *   sync: (container: Element | null | undefined) => void,
 *   clear: () => void,
 *   disconnect: () => void
 * }}
 */
export function createHeightMeasurer({ onMeasure }) {
  /** @type {number[]} Indexed by item, sparse where unmeasured. */
  let heights = [];
  /** @type {Set<Element>} */
  const observed = new Set();
  /** @type {ResizeObserver | null} */
  let observer = null;
  /**
   * Heights measured since the last frame, by item index. A Map so a second
   * batch reporting the same option supersedes the first rather than queueing
   * behind it.
   * @type {Map<number, number> | null}
   */
  let batched = null;
  /** Handle of the scheduled frame, or `0` when none is. */
  let frame = 0;

  /**
   * @param {Iterable<[number, number]>} measurements Index/height pairs.
   */
  function record(measurements) {
    /** @type {number[] | null} */
    let next = null;

    for (const [index, height] of measurements) {
      if (index < 0 || heights[index] === height) continue;
      if (next === null) next = heights.slice();
      next[index] = height;
    }

    if (next === null) return;

    const previousHeights = heights;
    heights = next;
    onMeasure(heights, previousHeights);
  }

  /** Report everything batched since the last frame, as one measurement. */
  function flush() {
    frame = 0;
    const measurements = batched;
    batched = null;
    // A frame can still be pending when the caller tears the measurer down.
    // Dropping those measurements beats writing into a destroyed component.
    if (observer === null || measurements === null) return;
    record(measurements);
  }

  /** @param {ResizeObserverEntry[]} entries */
  function handleResize(entries) {
    if (observer === null) return;

    for (const entry of entries) {
      // An element leaving the window is reported as a resize to nothing on
      // its way out. Zero is a real height for one still in the document; for
      // one that has left it only reports the removal.
      if (!entry.target.isConnected || !observed.has(entry.target)) continue;
      const index = readIndex(entry.target);
      if (index < 0) continue;
      batched ??= new Map();
      batched.set(index, readEntryHeight(entry));
    }

    if (batched === null || frame !== 0) return;
    frame = requestAnimationFrame(flush);
  }

  /**
   * Drop a batch that has not been reported yet. Whatever stops the window
   * being observed also leaves those heights describing options no longer
   * rendered there.
   */
  function cancelBatch() {
    if (frame !== 0) cancelAnimationFrame(frame);
    frame = 0;
    batched = null;
  }

  /** Stop observing every element, dropping any batch not yet reported. */
  function unobserveAll() {
    cancelBatch();
    observer?.disconnect();
    observed.clear();
  }

  /**
   * Reconcile what is observed against what `container` currently renders.
   * Call it after the DOM has been committed, since the elements have to exist
   * to have a height. Pass a falsy container when the window is gone.
   *
   * @param {Element | null | undefined} container
   */
  function sync(container) {
    if (!container) {
      unobserveAll();
      return;
    }

    const elements = container.querySelectorAll(`[${VIRTUAL_INDEX_ATTRIBUTE}]`);

    // No ResizeObserver (the unit test environment; same gap TreeView guards
    // for): read each height once and accept that later changes go unnoticed.
    if (typeof ResizeObserver === "undefined") {
      record(
        Array.from(elements, (element) => [
          readIndex(element),
          element.getBoundingClientRect().height,
        ]),
      );
      return;
    }

    if (observer === null) {
      observer = new ResizeObserver(handleResize);
    }

    const rendered = new Set(elements);

    for (const element of observed) {
      if (rendered.has(element)) continue;
      observer.unobserve(element);
      observed.delete(element);
    }

    for (const element of rendered) {
      if (observed.has(element)) continue;
      observer.observe(element);
      observed.add(element);
    }
  }

  /**
   * Forget every measurement, as when a menu closes or its collection is
   * replaced. Heights are indexed by item, so a new collection leaves each of
   * them describing the wrong element.
   *
   * Observation stops too, so the next `sync` starts it over. A keyed list
   * keeps the elements of surviving entries in place, and an element that does
   * not resize is never reported again, so observing it afresh asks once more.
   */
  function clear() {
    unobserveAll();

    if (heights.length === 0) return;

    const previousHeights = heights;
    heights = [];
    onMeasure(heights, previousHeights);
  }

  /** Stop observing for good. Measurements are kept but never updated again. */
  function disconnect() {
    unobserveAll();
    observer = null;
  }

  return { sync, clear, disconnect };
}
