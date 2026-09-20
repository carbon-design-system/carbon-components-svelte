/**
 * Context shared by `Chart` and the marks composed inside it.
 */
import type { Readable } from "svelte/store";
import type {
  ChartGroup,
  ChartMargins,
  ChartScales,
  ChartSeriesKey,
  ChartSize,
} from "./model.js";

export type ChartHoverPoint<T> = {
  series: ChartSeriesKey;
  datum: T;
  /** Index of the datum within its series. */
  index: number;
  y: number;
  /** Pixel position of `y`. */
  py: number;
  color: string;
};

export type ChartHover<T> = {
  /** Data-space x shared by every point. */
  x: number;
  /** Pixel position of `x`. */
  px: number;
  points: ChartHoverPoint<T>[];
} | null;

/**
 * What a mark may read and do. Marks render SVG only, subscribe to the
 * stores they draw from, and never measure the DOM.
 */
export type ChartContext<T> = {
  groups: Readable<ChartGroup<T>[]>;
  scales: Readable<ChartScales>;
  size: Readable<ChartSize>;
  hover: Readable<ChartHover<T>>;
  hidden: Readable<ReadonlyArray<ChartSeriesKey>>;
  /** Keep a y value inside the domain. Returns a function that releases it. */
  includeY(value: number): () => void;
  /**
   * Give every distinct x its own slot, as bars need. A numeric or time x
   * becomes categories. Returns a release function.
   */
  useBand(): () => void;
  /** Reserve margin space, as an axis title does. Returns a release function. */
  reserveMargin(side: keyof ChartMargins, px: number): () => void;
  /** Show or hide a series. The last visible series cannot be hidden. */
  toggleSeries(key: ChartSeriesKey): void;
  /** Hide every other series, or show them all again when already isolated. */
  isolateSeries(key: ChartSeriesKey): void;
  /** Clear the hover state, as Escape does. */
  clearHover(): void;
};

export const CHART_CONTEXT: "carbon:viz:Chart";
