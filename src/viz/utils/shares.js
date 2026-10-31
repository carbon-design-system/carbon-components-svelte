// @ts-check
// Part-to-whole math: each item's share of the total, with a folded tail.

/**
 * Share of the total for each item, in input order. Negative and non-finite
 * values count as zero. With `maxSegments`, the first `maxSegments - 1` items
 * keep their own segment and the rest fold into one trailing segment, so sort
 * by value first to fold the smallest.
 *
 * @template {string | number} Id
 * @param {ReadonlyArray<import("./shares.d.ts").ShareItem<Id>>} items
 * @param {{ maxSegments?: number; otherLabel?: string }} [options]
 * @returns {import("./shares.d.ts").Shares<Id>}
 */
export function getShares(items, { maxSegments, otherLabel = "Other" } = {}) {
  const n = items.length;
  const limit =
    maxSegments !== undefined && maxSegments >= 1 && n > maxSegments
      ? Math.floor(maxSegments) - 1
      : n;

  let total = 0;
  let folded = 0;
  /** @type {number[]} */
  const values = new Array(n);
  for (let i = 0; i < n; i++) {
    const value = items[i].value;
    values[i] = Number.isFinite(value) && value > 0 ? value : 0;
    total += values[i];
    if (i >= limit) folded += values[i];
  }

  /** @type {import("./shares.d.ts").ShareSegment<Id>[]} */
  const segments = new Array(limit);
  for (let i = 0; i < limit; i++) {
    const share = total > 0 ? values[i] / total : 0;
    segments[i] = {
      item: items[i],
      items: null,
      value: values[i],
      share,
      pct: share * 100,
      index: i,
    };
  }

  if (limit < n) {
    const share = total > 0 ? folded / total : 0;
    segments.push({
      item: {
        id: /** @type {Id} */ ("other"),
        label: otherLabel,
        value: folded,
      },
      items: items.slice(limit),
      value: folded,
      share,
      pct: share * 100,
      index: limit,
    });
  }

  return { total, segments };
}
