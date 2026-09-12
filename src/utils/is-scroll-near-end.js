// @ts-check

/** Default distance from the bottom (px) that counts as near end. */
export const DEFAULT_SCROLL_END_THRESHOLD = 32;

/**
 * True when the scroll position is within `threshold` px of the bottom.
 * Returns false when the content does not overflow.
 *
 * @param {Object} options
 * @param {number} options.scrollTop
 * @param {number} options.scrollHeight
 * @param {number} options.clientHeight
 * @param {number} [options.threshold=DEFAULT_SCROLL_END_THRESHOLD]
 * @returns {boolean}
 */
export function isScrollNearEnd({
  scrollTop,
  scrollHeight,
  clientHeight,
  threshold = DEFAULT_SCROLL_END_THRESHOLD,
}) {
  if (scrollHeight <= clientHeight) return false;
  return scrollTop + clientHeight >= scrollHeight - threshold;
}

/**
 * @typedef {Object} ScrollEndDetail
 * @property {number} scrollTop
 * @property {number} scrollHeight
 * @property {number} clientHeight
 */

/**
 * Fire-once-per-approach tracker for listbox near-bottom `scrollend`.
 * Re-arms after the user scrolls away from the bottom, and when the item
 * count grows so another page can be requested.
 *
 * @param {Object} [options]
 * @param {number} [options.threshold=DEFAULT_SCROLL_END_THRESHOLD]
 * @returns {{
 *   noteItemCount: (itemCount: number) => void,
 *   observe: (metrics: ScrollEndDetail & { itemCount?: number }) => ScrollEndDetail | null,
 *   reset: () => void,
 * }}
 */
export function createScrollEndTracker({
  threshold = DEFAULT_SCROLL_END_THRESHOLD,
} = {}) {
  let armed = true;
  /** @type {number | undefined} */
  let lastItemCount;

  /**
   * Re-arm when the rendered list grows.
   * @param {number} itemCount
   */
  function noteItemCount(itemCount) {
    if (lastItemCount !== undefined && itemCount > lastItemCount) {
      armed = true;
    }
    lastItemCount = itemCount;
  }

  return {
    noteItemCount,

    /**
     * @param {ScrollEndDetail & { itemCount?: number }} metrics
     * @returns {ScrollEndDetail | null}
     */
    observe(metrics) {
      if (typeof metrics.itemCount === "number") {
        noteItemCount(metrics.itemCount);
      }

      const nearEnd = isScrollNearEnd({
        scrollTop: metrics.scrollTop,
        scrollHeight: metrics.scrollHeight,
        clientHeight: metrics.clientHeight,
        threshold,
      });

      if (!nearEnd) {
        if (metrics.scrollHeight > metrics.clientHeight) {
          armed = true;
        }
        return null;
      }

      if (!armed) return null;
      armed = false;
      return {
        scrollTop: metrics.scrollTop,
        scrollHeight: metrics.scrollHeight,
        clientHeight: metrics.clientHeight,
      };
    },

    reset() {
      armed = true;
      lastItemCount = undefined;
    },
  };
}
