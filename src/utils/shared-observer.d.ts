/**
 * Call `callback` with the element's `ResizeObserverEntry` whenever its
 * size changes, and once after it is first observed. Every caller shares
 * one `ResizeObserver`. Returns an unsubscribe function; without
 * `ResizeObserver` (server rendering) it does nothing.
 */
export function observeResize(
  element: Element,
  callback: (entry: ResizeObserverEntry) => void,
): () => void;

/**
 * Call `callback` with the element's `IntersectionObserverEntry` whenever
 * it crosses `threshold` relative to the viewport grown by `rootMargin`,
 * and once after it is first observed. Callers with the same `rootMargin`
 * and `threshold` share one `IntersectionObserver`. Returns an unsubscribe
 * function; without `IntersectionObserver` it does nothing.
 *
 * `rootMargin` grows the viewport only. Inside a scroll container, such as
 * a modal body, the container's clipping still applies, so an element there
 * counts as near only once it scrolls into the container's view.
 */
export function observeIntersection(
  element: Element,
  callback: (entry: IntersectionObserverEntry) => void,
  options?: { rootMargin?: string; threshold?: number | number[] },
): () => void;
