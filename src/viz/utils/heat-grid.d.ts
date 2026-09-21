import type { VizDivergingPalette, VizSequentialHue } from "./tokens.js";

/** A sequential hue, or a diverging palette centered on the middle of the domain. */
export type HeatPalette = VizSequentialHue | VizDivergingPalette;

export type HeatGridOptions<T> = {
  x: (row: T, index: number) => unknown;
  y: (row: T, index: number) => unknown;
  value: (row: T, index: number) => unknown;
  /** Column keys, in order. Rows with another key are dropped. */
  xOrder?: ReadonlyArray<string | number>;
  /** Row keys, in order. Rows with another key are dropped. */
  yOrder?: ReadonlyArray<string | number>;
  /** Defaults to the extent of the cell values. */
  domain?: readonly [number, number];
  /** @default "blue" */
  palette?: HeatPalette;
};

export type HeatCell<T> = {
  row: string;
  column: string;
  rowIndex: number;
  columnIndex: number;
  /** Sum of the rows that landed on this cell. */
  value: number;
  data: T[];
  /** Fill, as a `var()` reference. */
  color: string;
  /** Label color that stays readable on the fill. */
  textColor: string;
};

export type HeatGrid<T> = {
  columns: string[];
  rows: Array<{ key: string; index: number; cells: Array<HeatCell<T> | null> }>;
  min: number;
  max: number;
  domain: [number, number];
};

/**
 * Color and label color for a value on a ramp. A sequential ramp runs from
 * `domain[0]` to `domain[1]`, starting at step 02 so the lowest value still
 * stands out from the background. A diverging ramp is centered on the middle
 * of the domain.
 */
export function heatColor(
  value: number,
  domain: readonly [number, number],
  palette: HeatPalette,
): { color: string; textColor: string };

/**
 * Pivot long rows into a grid: one row per `y` key, one column per `x` key,
 * both in first-seen order unless an order is given. Rows that land on the
 * same cell are summed. A cell nothing landed on is `null`.
 */
export function buildHeatGrid<T>(
  rows: ReadonlyArray<T>,
  options: HeatGridOptions<T>,
): HeatGrid<T>;
