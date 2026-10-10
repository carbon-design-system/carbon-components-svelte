import type { Bin } from "./bin.js";

export type HistogramBar = {
  bin: Bin;
  /** Height relative to the fullest bin, 0 to 100. */
  pct: number;
  index: number;
  /** Whether this bin holds the marker. */
  marked: boolean;
};

export type HistogramGeometry = {
  bars: HistogramBar[];
  /** Sum of every count. */
  total: number;
  /** The largest count. */
  max: number;
  domain: [number, number];
  /** Position of the marker across the domain, 0 to 100, or `null`. */
  markerPct: number | null;
};

/**
 * Bar heights for a list of bins, as percentages of the fullest bin, with the
 * position of an optional marker across the binned domain. The bin that holds
 * the marker is flagged. A marker outside the domain is clamped to the nearer
 * end and flags that end bin.
 */
export function getHistogramGeometry(
  bins: ReadonlyArray<Bin>,
  marker?: number | null,
): HistogramGeometry;
