// @ts-check
import { observeResize } from "../utils/shared-observer.js";
import { addPooledListener } from "../utils/window-listener-pool.js";

/**
 * Dev tools mark their roots, and any probe they add to the page, with
 * this attribute. Page scans skip them, and their DOM changes do not
 * trigger a scan.
 */
export const DEV_TOOL = "[data-ccs-dev-tool]";

/**
 * @typedef {{ top: number; bottom: number }} ScanBand
 */

/**
 * The part of the page a scan covers, in page coordinates: the viewport
 * plus one viewport height above and below. Scanning only near the
 * viewport keeps a scan's cost flat on long pages.
 * @returns {ScanBand}
 */
export function scanBand() {
  const height = document.documentElement.clientHeight;
  return {
    top: window.scrollY - height,
    bottom: window.scrollY + height * 2,
  };
}

/**
 * Whether a viewport rect overlaps `band`. `scrollY` turns the rect into
 * page coordinates.
 * @param {{ top: number; bottom: number }} rect
 * @param {ScanBand} band
 * @param {number} scrollY
 */
export function inBand(rect, band, scrollY) {
  return rect.bottom + scrollY >= band.top && rect.top + scrollY <= band.bottom;
}

/**
 * Whether a mutation came from the page and not from a dev tool. A
 * childList record targets the parent, so a probe appended to `<body>` is
 * judged by the nodes it added or removed.
 * @param {MutationRecord} record
 */
export function fromPage(record) {
  const target =
    record.target instanceof Element
      ? record.target
      : record.target.parentElement;
  // A node already removed from the page cannot move anything on it.
  if (!target?.isConnected || target.closest(DEV_TOOL)) return false;
  if (record.type !== "childList") return true;
  const nodes = [...record.addedNodes, ...record.removedNodes];
  return (
    nodes.length === 0 ||
    nodes.some((node) => !(node instanceof Element && node.matches(DEV_TOOL)))
  );
}

/**
 * Returns a lookup for the box an element moves with: the nearest
 * ancestor (or the element) whose `position` is one of `positions`, or
 * `null` for the page. Only positioned boxes can be fixed or sticky, so
 * it walks the `offsetParent` chain. Use one lookup per scan; it caches
 * each box's position.
 * @param {string[]} positions such as `["fixed"]` or `["fixed", "sticky"]`
 * @returns {(el: Element) => Element | null}
 */
export function createLayerLookup(positions) {
  /** @type {Map<Element, boolean>} */
  const cache = new Map();
  return (el) => {
    /** @type {Element | null} */
    let node = el instanceof HTMLElement ? el : el.closest("*:not(svg *)");
    while (node) {
      let match = cache.get(node);
      if (match === undefined) {
        match = positions.includes(getComputedStyle(node).position);
        cache.set(node, match);
      }
      if (match) return node;
      node = /** @type {HTMLElement} */ (node).offsetParent;
    }
    return null;
  };
}

/** @param {() => void} callback */
function whenIdle(callback) {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(callback, { timeout: 500 });
    return () => cancelIdleCallback(id);
  }
  const id = requestAnimationFrame(callback);
  return () => cancelAnimationFrame(id);
}

/**
 * Calls `callback` with a fresh scan band whenever the page may have
 * changed: a DOM change outside the dev tools, an attribute change on
 * `<html>` (`dir`, `lang`, a theme class), a resize, a font load, a
 * finished transition, or a scroll that leaves the last band.
 *
 * Scans are throttled to one per `intervalMs` and run when the browser is
 * idle, so a page that changes all the time (a clock, a live feed) is
 * scanned a few times a second, not on every change. The first scan runs
 * at once.
 *
 * `onScroll` runs once per frame while the page scrolls, for cheap work
 * such as moving a layer.
 * @param {(band: ScanBand) => void} callback
 * @param {{ intervalMs?: number; onScroll?: () => void }} [options]
 * @returns {{ schedule: () => void; destroy: () => void }}
 */
export function observePage(callback, options = {}) {
  const { intervalMs = 250, onScroll } = options;
  /** @type {ScanBand} */
  let band = { top: 0, bottom: 0 };
  let last = Number.NEGATIVE_INFINITY;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  /** @type {(() => void) | undefined} */
  let cancelIdle;
  let scrollFrame = 0;
  let destroyed = false;

  function run() {
    timer = undefined;
    cancelIdle = undefined;
    if (destroyed) return;
    last = performance.now();
    band = scanBand();
    callback(band);
  }

  function schedule() {
    if (destroyed || timer !== undefined || cancelIdle) return;
    const wait = Math.max(0, last + intervalMs - performance.now());
    timer = setTimeout(() => {
      timer = undefined;
      cancelIdle = whenIdle(run);
    }, wait);
  }

  function handleScroll() {
    if (!scrollFrame) {
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        onScroll?.();
        const height = document.documentElement.clientHeight;
        if (
          window.scrollY < band.top ||
          window.scrollY + height > band.bottom
        ) {
          schedule();
        }
      });
    }
  }

  /** @param {Event} event */
  function handleSettled(event) {
    const target = event.target;
    if (!(target instanceof Element && target.closest(DEV_TOOL))) schedule();
  }

  /** @param {Event} event */
  function handleNestedScroll(event) {
    // A scroll container moved its content; the page itself did not.
    if (event.target !== document && event.target !== window) schedule();
  }

  const mutations = new MutationObserver((records) => {
    if (records.some(fromPage)) schedule();
  });
  mutations.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class", "style", "hidden", "dir", "open"],
  });
  // A `dir`, `lang`, or theme change on <html> moves the whole page
  // without resizing it, and <html> is outside the body subtree.
  mutations.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["dir", "lang", "class", "style", "theme"],
  });

  let observed = false;
  const cleanups = [
    // Skip the initial callback: the first scan already ran.
    observeResize(document.documentElement, () => {
      if (observed) schedule();
      observed = true;
    }),
    addPooledListener("resize", schedule, { passive: true }),
    addPooledListener("scroll", handleScroll, { passive: true }),
    addPooledListener("scroll", handleNestedScroll, {
      passive: true,
      capture: true,
    }),
    // Hover, focus, and press states animate in; scan once they settle
    // rather than reading colors mid-transition.
    addPooledListener("transitionend", handleSettled, true),
    addPooledListener("animationend", handleSettled, true),
  ];
  document.fonts?.ready.then(schedule);
  run();

  return {
    schedule,
    destroy() {
      destroyed = true;
      mutations.disconnect();
      for (const cleanup of cleanups) cleanup();
      clearTimeout(timer);
      cancelIdle?.();
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
    },
  };
}
