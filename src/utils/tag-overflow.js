// @ts-check

/**
 * Compute how many tags fit before the overflow trigger, given their
 * measured widths in order and the space available. Backtracks by one tag
 * at a time if the overflow trigger itself doesn't fit once at least one tag
 * is hidden.
 *
 * @param {Object} options
 * @param {number[]} options.tagWidths - measured width of each tag, in order
 * @param {number} options.availableWidth
 * @param {number} options.overflowWidth - measured width of the "+N" trigger
 * @param {number} [options.maxVisible] - upper bound independent of space
 * @returns {number} count of tags to render before the overflow trigger
 */
export function getVisibleTagCount({
  tagWidths,
  availableWidth,
  overflowWidth,
  maxVisible,
}) {
  let willFit = 0;
  let remaining = availableWidth;

  for (const width of tagWidths) {
    if (remaining < width) break;
    remaining -= width;
    willFit += 1;
  }

  if (willFit < tagWidths.length) {
    while (willFit > 0 && remaining < overflowWidth) {
      willFit -= 1;
      remaining += tagWidths[willFit];
    }
  }

  return maxVisible == null ? willFit : Math.min(willFit, maxVisible);
}
