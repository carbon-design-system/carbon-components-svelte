import type { LinearScale } from "../utils/scale-linear.js";
import type { VizSequentialHue } from "../utils/tokens.js";

export type HorizonOptions<T> = {
  x: (row: T, index: number) => unknown;
  y: (row: T, index: number) => unknown;
  series?: (row: T, index: number) => unknown;
  /** Layers each series is cut into. @default 3 */
  bands?: number;
  /** The value that fills every layer. Defaults to the largest magnitude, rounded out. */
  max?: number;
  /** Where the rows run, in pixels. */
  plot: { x0: number; x1: number };
  rowHeight: number;
  /** @default "blue" */
  hue?: VizSequentialHue;
  /** Hue of values below zero. @default "purple" */
  negativeHue?: VizSequentialHue;
  locale?: string;
  utc?: boolean;
};

export type HorizonSeries<T> = {
  key: string;
  index: number;
  /** Ascending. */
  xs: number[];
  ys: number[];
  rows: T[];
  /** One filled path per layer that has anything in it, lowest first. */
  bands: Array<{
    /** `1` for the first layer above zero, `-1` for the first below. */
    level: number;
    d: string;
    color: string;
  }>;
  last: number;
  min: number;
  max: number;
};

export type Horizon<T> = {
  domain: [number, number];
  /** The value each layer holds. */
  step: number;
  layers: number;
  /** The value that fills the last layer. */
  top: number;
  /** Every distinct x, ascending, for hover and the keyboard. */
  xs: number[];
  series: HorizonSeries<T>[];
  ticks: Array<{ value: number; px: number; label: string }>;
  xLabel: (value: number) => string;
  x: Pick<LinearScale, "map" | "invert">;
};

/** Cut every series into layers folded onto one short row. */
export function buildHorizon<T>(
  rows: ReadonlyArray<T>,
  options: HorizonOptions<T>,
): Horizon<T>;
