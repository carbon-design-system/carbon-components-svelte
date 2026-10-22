// @ts-check

/**
 * Decide which of an anchor's edges a floating menu aligns to. The menu is
 * left-aligned to the anchor by default and right-aligned when flipped.
 *
 * Flipping only pays off when the default placement runs past the right edge
 * of the viewport and the flipped placement clears the left edge. A menu wider
 * than the space on either side stays where it is, since flipping would only
 * move the clipping to the other end.
 *
 * @param {Object} options
 * @param {number} options.anchorLeft   Anchor's viewport-relative left edge.
 * @param {number} options.anchorWidth
 * @param {number} options.floatingWidth
 * @param {number} options.viewportWidth
 * @returns {boolean} True when the menu should align to the anchor's right edge.
 */
export function shouldFlipHorizontally({
  anchorLeft,
  anchorWidth,
  floatingWidth,
  viewportWidth,
}) {
  const overflowsRight = anchorLeft + floatingWidth > viewportWidth;
  if (!overflowsRight) return false;

  return anchorLeft + anchorWidth - floatingWidth >= 0;
}
