// @ts-check
// One `ResizeObserver` for every chart on the page. A dashboard of fifty
// charts would otherwise create fifty observers, each delivering on its own.

/** @type {ResizeObserver | null} */
let observer = null;
/** @type {Map<Element, (width: number, height: number) => void>} */
const callbacks = new Map();
/** @type {Map<Element, { width: number, height: number }>} */
const pending = new Map();
let frame = 0;

function flush() {
  frame = 0;
  for (const [node, size] of pending) {
    callbacks.get(node)?.(size.width, size.height);
  }
  pending.clear();
}

/** @param {ResizeObserverEntry[]} entries */
function onResize(entries) {
  for (const entry of entries) {
    pending.set(entry.target, {
      width: entry.contentRect.width,
      height: entry.contentRect.height,
    });
  }
  // Coalesce to one delivery per frame, keeping only the latest size.
  if (!frame) frame = requestAnimationFrame(flush);
}

/**
 * Call `callback` with the content size of `node` whenever it changes, at
 * most once per frame. Returns a function that stops observing. The shared
 * observer is created by the first caller and disconnected by the last. Does
 * nothing where `ResizeObserver` is unavailable.
 *
 * @param {Element} node
 * @param {(width: number, height: number) => void} callback
 * @returns {() => void}
 */
export function observeResize(node, callback) {
  if (typeof ResizeObserver === "undefined") return () => {};
  if (!observer) observer = new ResizeObserver(onResize);
  callbacks.set(node, callback);
  observer.observe(node);

  return () => {
    if (!callbacks.delete(node)) return;
    pending.delete(node);
    observer?.unobserve(node);
    if (callbacks.size === 0) {
      observer?.disconnect();
      observer = null;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}
