/**
 * Calls `onMove` when `element` moves in the viewport without a scroll or a
 * resize, like when content is inserted above it. An `IntersectionObserver`
 * whose root margin shrinks the viewport to the element's own box sees the
 * visible share change as soon as the element shifts by a pixel. This is
 * the technique Floating UI's `autoUpdate` uses for `layoutShift`.
 *
 * Returns a function that stops watching. Without `IntersectionObserver`
 * (server rendering) it does nothing.
 *
 * @param {Element} element
 * @param {() => void} onMove
 * @returns {() => void}
 */
export function observeMove(element, onMove) {
  const Observer = globalThis.IntersectionObserver;
  if (typeof Observer !== "function") return () => {};

  /** @type {IntersectionObserver | null} */
  let observer = null;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let retry;

  function stop() {
    clearTimeout(retry);
    observer?.disconnect();
    observer = null;
  }

  /**
   * Watch the element where it is now. `threshold` is the share of it that
   * shows: all of it, unless a scroll container or the window edge clips it.
   *
   * @param {number} threshold
   * @param {boolean} notify Call `onMove` first.
   */
  function watch(threshold, notify) {
    stop();
    const rect = element.getBoundingClientRect();
    if (notify) onMove();
    if (!rect.width || !rect.height) return;

    const root = element.ownerDocument.documentElement;
    const top = Math.floor(rect.top);
    const right = Math.floor(root.clientWidth - rect.right);
    const bottom = Math.floor(root.clientHeight - rect.bottom);
    const left = Math.floor(rect.left);
    const rootMargin = `${-top}px ${-right}px ${-bottom}px ${-left}px`;

    let first = true;
    observer = new Observer(
      ([entry]) => {
        const ratio = entry.intersectionRatio;
        if (ratio !== threshold) {
          if (!first) {
            watch(1, true);
          } else if (ratio === 0) {
            // Clipped out of view: look again later with a threshold
            // just above zero.
            retry = setTimeout(() => watch(1e-7, true), 1000);
          } else {
            // Partly clipped: watch for a change from the share that shows.
            watch(ratio, true);
          }
          return;
        }
        // Moved between measuring and observing.
        if (ratio === 1 && !sameRect(rect, element.getBoundingClientRect())) {
          watch(1, true);
          return;
        }
        first = false;
      },
      { rootMargin, threshold: Math.max(0, Math.min(1, threshold)) || 1 },
    );
    observer.observe(element);
  }

  watch(1, false);
  return stop;
}

/**
 * @param {DOMRect} a
 * @param {DOMRect} b
 */
function sameRect(a, b) {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}
