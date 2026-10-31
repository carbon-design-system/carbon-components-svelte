import type { VizColor, VizSemanticColor } from "../utils/tokens.js";

export type TimelineOptions<T> = {
  row: (row: T, index: number) => unknown;
  state: (row: T, index: number) => unknown;
  start: (row: T, index: number) => unknown;
  end: (row: T, index: number) => unknown;
  /** Defaults to the earliest start and the latest end. */
  domain?: readonly [Date | number | string, Date | number | string];
  /** Color per state: a semantic name, or any color. */
  states?: Record<string, VizSemanticColor | VizColor>;
  palette?: number;
  locale?: string;
  utc?: boolean;
};

export type TimelineSegment<T> = {
  /** Unique across the chart: the row key and the input index joined. */
  id: string;
  row: string;
  state: string;
  /** Epoch milliseconds, before clipping. */
  from: number;
  to: number;
  duration: number;
  datum: T;
  index: number;
  color: string;
  /** Position and width as percentages of the domain, after clipping. */
  startPct: number;
  widthPct: number;
};

export type Timeline<T> = {
  domain: [number, number];
  states: Array<{ key: string; color: string }>;
  ticks: Array<{ value: number; pct: number; label: string }>;
  rows: Array<{ key: string; segments: TimelineSegment<T>[] }>;
};

/**
 * Group spans into rows, in first-seen order, and place each on a shared
 * time scale as percentages of the domain. The domain defaults to the
 * earliest start and the latest end. A span outside it is clipped, and one
 * entirely outside is dropped. States are colored in first-seen order, or
 * by the `states` map, whose values are semantic names or any color.
 */
export function buildTimeline<T>(
  rows: ReadonlyArray<T>,
  options: TimelineOptions<T>,
): Timeline<T>;
