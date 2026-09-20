// @ts-check

/**
 * Determine whether a horizontally scrollable element can still scroll
 * backward/forward from its current position.
 *
 * @param {Object} options
 * @param {number} options.scrollLeft
 * @param {number} options.scrollWidth
 * @param {number} options.clientWidth
 * @param {number} [options.forwardEpsilon=0] - extra px of slack before
 *   reporting forward overflow, to absorb a browser's sub-pixel rounding
 *   (Firefox can report scrollWidth 1px larger than clientWidth with
 *   nowhere left to scroll).
 * @returns {{ canScrollBackward: boolean; canScrollForward: boolean }}
 */
export function computeScrollOverflow({
  scrollLeft,
  scrollWidth,
  clientWidth,
  forwardEpsilon = 0,
}) {
  return {
    canScrollBackward: scrollLeft > 0,
    canScrollForward:
      Math.ceil(scrollLeft + clientWidth) + forwardEpsilon < scrollWidth,
  };
}

/**
 * Scroll `node` by roughly 75% of its own width, in the given direction.
 *
 * @param {HTMLElement | null | undefined} node
 * @param {1 | -1} direction
 */
export function scrollByViewport(node, direction) {
  if (!node) return;
  node.scrollBy({
    left: direction * node.clientWidth * 0.75,
    behavior: "smooth",
  });
}

/**
 * Scroll `container` horizontally so `target` is fully visible, inset from
 * each edge by `margin` so it isn't tucked under an overflow button.
 *
 * @param {HTMLElement | null | undefined} container
 * @param {HTMLElement | null | undefined} target
 * @param {number} [margin=0]
 */
export function scrollIntoViewX(container, target, margin = 0) {
  if (!container || !target) return;

  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const leftOverflow = targetRect.left - (containerRect.left + margin);
  const rightOverflow = targetRect.right - (containerRect.right - margin);

  if (leftOverflow < 0) {
    container.scrollLeft += leftOverflow;
  } else if (rightOverflow > 0) {
    container.scrollLeft += rightOverflow;
  }
}
