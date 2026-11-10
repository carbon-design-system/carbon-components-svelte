// @ts-check

/**
 * The largest count, up to `upper`, for which `fits(count)` holds. The
 * count never goes below `min`: that many always show, fitting or not.
 *
 * Searches by doubling from `min`, then by halving: a list that fits three
 * items in a thousand is settled by probes of a few items each, where a
 * plain binary search would measure the middle of the thousand first. It
 * assumes a longer list is never narrower than a shorter one, within the
 * width of one item. A "3 more" that gets longer as "12 more" can break
 * that by a few pixels; the answer then depends only on the width, so the
 * same width always gives the same count.
 *
 * @param {number} upper
 * @param {(count: number) => boolean} fits
 * @param {number} [min]
 * @returns {number}
 */
export function fitCount(upper, fits, min = 1) {
  let low = Math.min(min, upper);
  if (low >= upper) return low;

  // `low` fits; `high` is the first count known not to.
  let high = upper + 1;
  let step = 1;
  while (low < upper) {
    const probe = Math.min(upper, low + step);
    if (!fits(probe)) {
      high = probe;
      break;
    }
    low = probe;
    step *= 2;
  }

  while (high - low > 1) {
    const middle = low + Math.floor((high - low) / 2);
    if (fits(middle)) low = middle;
    else high = middle;
  }
  return low;
}
