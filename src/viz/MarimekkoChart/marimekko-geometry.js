// @ts-check
// Column and cell geometry for `MarimekkoChart`: a column per category as
// wide as its total, split into cells as tall as each series' share.

import { categoricalColors, vizColor } from "../utils/tokens.js";

/**
 * Columns in first-seen order, or largest first, each as wide as its
 * share of the whole; cells in series order, each as tall as its share of
 * the column. Values below zero count as nothing.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./marimekko-geometry.d.ts").MarimekkoOptions<T>} options
 * @returns {import("./marimekko-geometry.d.ts").Marimekko<T>}
 */
export function buildMarimekko(rows, options) {
  const {
    x,
    y,
    series,
    label,
    xValue,
    sort = "none",
    width,
    height,
    gap = 2,
    palette = 1,
    colors = {},
  } = options;

  /** @type {string[]} */
  const seriesKeys = [];
  /** @type {Map<string, { key: string; size: number | undefined; total: number; cells: Array<{ key: string; value: number; datum: T; index: number }> }>} */
  const columns = new Map();
  rows.forEach((row, i) => {
    const key = String(x(row, i));
    const seriesKey = String(series(row, i));
    if (!seriesKeys.includes(seriesKey)) seriesKeys.push(seriesKey);
    const raw = y(row, i);
    const value = Math.max(
      0,
      raw === null || raw === undefined ? 0 : Number(raw) || 0,
    );
    let column = columns.get(key);
    if (!column) {
      column = { key, size: undefined, total: 0, cells: [] };
      columns.set(key, column);
    }
    if (xValue && column.size === undefined) {
      const given = Number(xValue(row, i));
      if (Number.isFinite(given) && given >= 0) column.size = given;
    }
    column.total += value;
    column.cells.push({ key: seriesKey, value, datum: row, index: i });
  });

  const assigned = categoricalColors(seriesKeys.length, palette);
  /** @type {Map<string, string>} */
  const colorOf = new Map();
  seriesKeys.forEach((key, i) => {
    const fixed = colors[key];
    colorOf.set(
      key,
      fixed === undefined ? assigned[i] : (vizColor(fixed) ?? assigned[i]),
    );
  });

  const ordered = [...columns.values()];
  const sizeOf = (/** @type {(typeof ordered)[number]} */ column) =>
    column.size ?? column.total;
  if (sort === "value") ordered.sort((a, b) => sizeOf(b) - sizeOf(a));
  const whole = ordered.reduce((sum, column) => sum + sizeOf(column), 0);
  const gaps = Math.max(ordered.length - 1, 0) * gap;
  const usable = Math.max(width - gaps, 0);

  let at = 0;
  const placed = ordered.map((column, order) => {
    const share = whole > 0 ? sizeOf(column) / whole : 0;
    const columnWidth = usable * share;
    const x0 = at;
    at += columnWidth + gap;
    // Cells in series order, so a series is the same band in every column.
    const inOrder = seriesKeys.flatMap((key) =>
      column.cells.filter((cell) => cell.key === key),
    );
    let top = 0;
    const cells = inOrder.map((cell) => {
      const cellShare = column.total > 0 ? cell.value / column.total : 0;
      const y0 = top;
      top += cellShare * height;
      return {
        key: cell.key,
        column: column.key,
        value: cell.value,
        share: cellShare,
        x0,
        x1: x0 + columnWidth,
        y0,
        y1: top,
        color: /** @type {string} */ (colorOf.get(cell.key)),
        datum: cell.datum,
        index: cell.index,
      };
    });
    return {
      key: column.key,
      label: label
        ? String(
            label(column.cells[0]?.datum, column.cells[0]?.index ?? 0) ??
              column.key,
          )
        : column.key,
      order,
      size: sizeOf(column),
      total: column.total,
      share,
      x0,
      x1: x0 + columnWidth,
      cells,
    };
  });

  return {
    columns: placed,
    series: seriesKeys.map((key) => ({
      key,
      color: /** @type {string} */ (colorOf.get(key)),
    })),
    total: whole,
  };
}
