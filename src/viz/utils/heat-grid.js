// @ts-check
// Arrange long rows into a grid of colored cells for heatmaps.
import {
  contrastTextColor,
  divergingColor,
  divergingStep,
  sequentialColor,
  sequentialStep,
} from "./color-scale.js";

const DIVERGING = ["red-cyan", "purple-teal"];

/**
 * Color and label color for a value on a ramp. A sequential ramp runs from
 * `domain[0]` to `domain[1]`, starting at step 02 so the lowest value still
 * stands out from the background. A diverging ramp is centered on the middle
 * of the domain.
 *
 * @param {number} value
 * @param {readonly [number, number]} domain
 * @param {import("./heat-grid.d.ts").HeatPalette} palette
 * @returns {{ color: string; textColor: string }}
 */
export function heatColor(value, domain, palette) {
  const span = domain[1] - domain[0];
  if (DIVERGING.includes(palette)) {
    const mid = (domain[0] + domain[1]) / 2;
    const t =
      span > 0 ? Math.min(1, Math.max(-1, (value - mid) / (span / 2))) : 0;
    return {
      color: divergingColor(
        t,
        /** @type {import("./tokens.d.ts").VizDivergingPalette} */ (palette),
      ),
      textColor: contrastTextColor(divergingStep(t), "diverging"),
    };
  }
  const t = span > 0 ? Math.min(1, Math.max(0, (value - domain[0]) / span)) : 1;
  const hue = /** @type {import("./tokens.d.ts").VizSequentialHue} */ (palette);
  return {
    color: sequentialColor(t, hue, { minStep: 2 }),
    textColor: contrastTextColor(sequentialStep(t, { minStep: 2 })),
  };
}

/**
 * Pivot long rows into a grid: one row per `y` key, one column per `x` key,
 * both in first-seen order unless an order is given. Rows that land on the
 * same cell are summed. A cell nothing landed on is `null`.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./heat-grid.d.ts").HeatGridOptions<T>} options
 * @returns {import("./heat-grid.d.ts").HeatGrid<T>}
 */
export function buildHeatGrid(rows, options) {
  const { x, y, value, palette = "blue" } = options;

  /** @type {Map<string, number>} */
  const columnIndex = new Map();
  /** @type {Map<string, number>} */
  const rowIndex = new Map();
  for (const key of options.xOrder ?? [])
    columnIndex.set(String(key), columnIndex.size);
  for (const key of options.yOrder ?? [])
    rowIndex.set(String(key), rowIndex.size);

  /** @type {Array<{ r: number; c: number; value: number; data: T[] }>} */
  const filled = [];
  /** @type {Map<string, number>} */
  const cellIndex = new Map();
  for (let i = 0; i < rows.length; i++) {
    const amount = Number(value(rows[i], i));
    if (!Number.isFinite(amount)) continue;
    const column = String(x(rows[i], i));
    const row = String(y(rows[i], i));
    if (!columnIndex.has(column)) {
      if (options.xOrder) continue;
      columnIndex.set(column, columnIndex.size);
    }
    if (!rowIndex.has(row)) {
      if (options.yOrder) continue;
      rowIndex.set(row, rowIndex.size);
    }
    const r = /** @type {number} */ (rowIndex.get(row));
    const c = /** @type {number} */ (columnIndex.get(column));
    const id = `${r}:${c}`;
    const at = cellIndex.get(id);
    if (at === undefined) {
      cellIndex.set(id, filled.length);
      filled.push({ r, c, value: amount, data: [rows[i]] });
    } else {
      filled[at].value += amount;
      filled[at].data.push(rows[i]);
    }
  }

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const cell of filled) {
    if (cell.value < min) min = cell.value;
    if (cell.value > max) max = cell.value;
  }
  if (filled.length === 0) {
    min = 0;
    max = 0;
  }
  /** @type {[number, number]} */
  const domain = options.domain
    ? [options.domain[0], options.domain[1]]
    : [min, max];

  const columns = [...columnIndex.keys()];
  const grid = [...rowIndex.keys()].map((key, r) => ({
    key,
    index: r,
    /** @type {Array<import("./heat-grid.d.ts").HeatCell<T> | null>} */
    cells: new Array(columns.length).fill(null),
  }));
  for (const cell of filled) {
    grid[cell.r].cells[cell.c] = {
      row: grid[cell.r].key,
      column: columns[cell.c],
      rowIndex: cell.r,
      columnIndex: cell.c,
      value: cell.value,
      data: cell.data,
      ...heatColor(cell.value, domain, palette),
    };
  }

  return { columns, rows: grid, min, max, domain };
}
