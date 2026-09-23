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
  /** Pixel position of `y`, on the y scale its series is plotted on. */
  py: number;
  /** Which y scale the series is plotted on. Defaults to the first. */
  axis?: "y" | "y2";
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
  /** Whether the chart or its data table is showing. */
  view: Readable<"chart" | "table">;
  /** The chart's title, which names the data table too. */
  title: Readable<string>;
  /** Header of the x column in the data table. Never empty. */
  xHeader: Readable<string>;
  /** Whether the chart fills the screen. */
  fullscreen: Readable<boolean>;
  /** Enter or leave fullscreen. The plot grows to fill what the screen leaves. */
  toggleFullscreen(): void;
  /**
   * The plot as a standalone image, with the title above and the visible
   * series below: SVG markup, or a PNG blob at twice the pixel density.
   */
  exportImage(format: "svg" | "png"): Promise<string | Blob>;
  /** The visible x range, or `null` when everything shows. */
  zoom: Readable<[number, number] | null>;
  /** The x range with no zoom applied, and how x values are read. */
  fullX: Readable<{
    domain: [number, number];
    kind: "time" | "linear" | "category";
  }>;
  /** `clip-path` value that keeps a mark inside the plot. Set while zoomed. */
  clip: Readable<string | undefined>;
  /** The shared canvas behind the SVG, for marks that paint pixels. */
  canvas: import("./canvas-layer.js").CanvasLayer;
  /** Show an x range, or everything with `null`. */
  setZoom(range: [number, number] | null): void;
  /** Switch between the chart and its data table. */
  setView(view: "chart" | "table"): void;
  /** Keep a y value inside the domain. Returns a function that releases it. */
  includeY(value: number): () => void;
  /**
   * Give every distinct x its own slot, as bars need. A numeric or time x
   * becomes categories. Returns a release function.
   */
  useBand(): () => void;
  /**
   * Make hover follow the nearest point in both directions, as a scatter
   * plot needs, instead of the nearest x. Returns a release function.
   */
  usePointHover(): () => void;
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
