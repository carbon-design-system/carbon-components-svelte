// @ts-check
// Line and label geometry for `BumpChart`: a rank per series per period,
// rank one on top, and a line that bumps up and down between them.

import { scalePoint } from "../utils/scale-band.js";
import { spreadLabels } from "../utils/spread-labels.js";
import { categoricalColors, vizColor } from "../utils/tokens.js";

/**
 * A line per series through its rank in each period. Ranks come from the
 * rows, or from the values with the largest ranked first. A period a
 * series is missing breaks its line.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./bump-geometry.d.ts").BumpOptions<T>} options
 * @returns {import("./bump-geometry.d.ts").Bump<T>}
 */
export function buildBump(rows, options) {
  const {
    x,
    rank,
    y,
    series,
    label,
    periods,
    width,
    height,
    labelWidth,
    labelGap = 16,
    palette = 1,
    colors = {},
  } = options;

  /** @type {string[]} */
  const seen = [];
  /** @type {Map<string, Map<string, { rank: number; value: number | undefined; row: T; index: number }>>} */
  const bySeries = new Map();
  /** @type {Map<string, string>} */
  const labels = new Map();
  rows.forEach((row, i) => {
    const period = String(x(row, i));
    if (!seen.includes(period)) seen.push(period);
    const key = String(series(row, i));
    if (!labels.has(key))
      labels.set(key, label ? String(label(row, i) ?? key) : key);
    let cells = bySeries.get(key);
    if (!cells) {
      cells = new Map();
      bySeries.set(key, cells);
    }
    const rawValue = y ? y(row, i) : undefined;
    const value =
      rawValue === null || rawValue === undefined
        ? undefined
        : Number(rawValue);
    const rawRank = rank ? rank(row, i) : undefined;
    const place =
      rawRank === null || rawRank === undefined ? Number.NaN : Number(rawRank);
    cells.set(period, { rank: place, value, row, index: i });
  });
  const order = periods ? periods.map(String) : seen;
  const keys = [...bySeries.keys()];

  // Without ranks, rank each period by value, the largest first.
  if (!rank && y) {
    for (const period of order) {
      const entries = keys
        .map((key) => bySeries.get(key)?.get(period))
        .filter((cell) => cell !== undefined && Number.isFinite(cell.value))
        .sort(
          (a, b) =>
            /** @type {number} */ (b?.value) - /** @type {number} */ (a?.value),
        );
      entries.forEach((cell, i) => {
        if (cell) cell.rank = i + 1;
      });
    }
  }

  let maxRank = 0;
  for (const cells of bySeries.values()) {
    for (const cell of cells.values()) {
      if (Number.isFinite(cell.rank)) maxRank = Math.max(maxRank, cell.rank);
    }
  }
  maxRank = Math.max(maxRank, 1);
  const row = height / maxRank;
  const scale = scalePoint({
    domain: order,
    range: [labelWidth, width - labelWidth],
  });
  const yOf = (/** @type {number} */ at) => (at - 0.5) * row;
  const assigned = categoricalColors(keys.length, palette);

  const lines = keys.map((key, i) => {
    const cells =
      /** @type {Map<string, { rank: number; value: number | undefined; row: T; index: number }>} */ (
        bySeries.get(key)
      );
    const points = order.flatMap((period, at) => {
      const cell = cells.get(period);
      if (!cell || !Number.isFinite(cell.rank)) return [];
      return [
        {
          period,
          at,
          rank: cell.rank,
          value: cell.value,
          x: scale.map(period),
          y: yOf(cell.rank),
          datum: cell.row,
        },
      ];
    });
    // Consecutive periods join; a gap starts a new run.
    let d = "";
    for (let j = 0; j < points.length; j++) {
      const point = points[j];
      const prev = points[j - 1];
      if (!prev || prev.at !== point.at - 1) {
        d += `M${point.x},${point.y}`;
      } else {
        const mid = (prev.x + point.x) / 2;
        d += `C${mid},${prev.y} ${mid},${point.y} ${point.x},${point.y}`;
      }
    }
    const first = points[0];
    const last = points[points.length - 1];
    const fixed = colors[key];
    return {
      key,
      index: i,
      label: /** @type {string} */ (labels.get(key)),
      color:
        fixed === undefined ? assigned[i] : (vizColor(fixed) ?? assigned[i]),
      points,
      d,
      start: first ? first.rank : null,
      end: last ? last.rank : null,
      change: first && last ? first.rank - last.rank : 0,
      leftY: first ? first.y : 0,
      rightY: last ? last.y : 0,
    };
  });
  const leftYs = spreadLabels(
    lines.map((line) => line.leftY),
    labelGap,
    0,
    height,
  );
  const rightYs = spreadLabels(
    lines.map((line) => line.rightY),
    labelGap,
    0,
    height,
  );
  lines.forEach((line, i) => {
    line.leftY = leftYs[i];
    line.rightY = rightYs[i];
  });

  return {
    periods: order.map((period) => ({ key: period, x: scale.map(period) })),
    lines,
    ranks: Array.from({ length: maxRank }, (_, i) => ({
      rank: i + 1,
      y: yOf(i + 1),
    })),
    x0: labelWidth,
    x1: width - labelWidth,
  };
}
