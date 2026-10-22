/**
 * One `ResizeObserver` for every chart on the page.
 */

/**
 * Call `callback` with the content size of `node` whenever it changes, at
 * most once per frame. Returns a function that stops observing. The shared
 * observer is created by the first caller and disconnected by the last. Does
 * nothing where `ResizeObserver` is unavailable.
 */
export function observeResize(
  node: Element,
  callback: (width: number, height: number) => void,
): () => void;
