// @ts-check
// Ranking math: order, top-N with a folded remainder, and bar length per row.

/**
 * Rank items by value. Rows are sorted descending unless `sort` is `false`,
 * and numbered from 1. With `top`, only the first `top` rows are kept; with
 * `other` as well, the remainder folds into one unranked trailing row. Bar
 * length (`pct`) is relative to the largest row, the folded one included.
 * Share is relative to the total of every item. Negative and non-finite
 * values count as zero.
 *
 * @template {string | number} Id
 * @param {ReadonlyArray<import("./shares.d.ts").ShareItem<Id>>} items
 * @param {{ top?: number; other?: boolean; otherLabel?: string; sort?: boolean }} [options]
 * @returns {import("./rank.d.ts").Ranks<Id>}
 */
export function getRanks(
  items,
  { top, other = false, otherLabel = "Other", sort = true } = {},
) {
  const n = items.length;
  /** @type {Array<{ item: import("./shares.d.ts").ShareItem<Id>; value: number }>} */
  const entries = new Array(n);
  let total = 0;
  for (let i = 0; i < n; i++) {
    const value = items[i].value;
    const clean = Number.isFinite(value) && value > 0 ? value : 0;
    entries[i] = { item: items[i], value: clean };
    total += clean;
  }
  if (sort) entries.sort((a, b) => b.value - a.value);

  const limit = top !== undefined && top >= 0 && top < n ? Math.floor(top) : n;
  let folded = 0;
  for (let i = limit; i < n; i++) folded += entries[i].value;
  const hasOther = other && limit < n;

  let max = hasOther ? folded : 0;
  for (let i = 0; i < limit; i++) {
    if (entries[i].value > max) max = entries[i].value;
  }

  /** @type {import("./rank.d.ts").RankRow<Id>[]} */
  const rows = new Array(limit);
  for (let i = 0; i < limit; i++) {
    const { item, value } = entries[i];
    rows[i] = {
      item,
      items: null,
      value,
      rank: i + 1,
      share: total > 0 ? value / total : 0,
      pct: max > 0 ? (value / max) * 100 : 0,
      index: i,
    };
  }
  if (hasOther) {
    rows.push({
      item: {
        id: /** @type {Id} */ ("other"),
        label: otherLabel,
        value: folded,
      },
      items: entries.slice(limit).map((entry) => entry.item),
      value: folded,
      rank: null,
      share: total > 0 ? folded / total : 0,
      pct: max > 0 ? (folded / max) * 100 : 0,
      index: limit,
    });
  }

  return { total, max, rows };
}
