import type { VizColor, VizSemanticColor } from "../utils/tokens.js";

export type SpanOptions<T> = {
  id: (row: T, index: number) => unknown;
  /** `null`, `undefined`, or `""` for a root span. */
  parent: (row: T, index: number) => unknown;
  start: (row: T, index: number) => unknown;
  /** Length in milliseconds. Ignored when `end` is given. */
  duration?: (row: T, index: number) => unknown;
  end?: (row: T, index: number) => unknown;
  label?: (row: T, index: number) => unknown;
  /** What colors a span: a service, a kind, or the like. */
  group?: (row: T, index: number) => unknown;
  /** Ids whose descendants are left out. */
  collapsed?: ReadonlyArray<string | number>;
  /** Defaults to the earliest start and the latest end. */
  domain?: readonly [Date | number | string, Date | number | string];
  /** Color per group: a semantic name, or any color. */
  groups?: Record<string, VizSemanticColor | VizColor>;
  palette?: number;
  locale?: string;
  utc?: boolean;
  /** Label the axis with times of day rather than offsets from the start. */
  absolute?: boolean;
};

export type SpanRow<T> = {
  id: string;
  parent: string | null;
  depth: number;
  label: string;
  group: string;
  /** Epoch milliseconds or offsets, as the data gave them, before clipping. */
  from: number;
  to: number;
  duration: number;
  /** Milliseconds after the domain start. */
  offset: number;
  datum: T;
  index: number;
  /** How many children the span has, shown or not. */
  children: number;
  collapsed: boolean;
  /** On the chain of spans that decided how long the whole took. */
  critical: boolean;
  color: string | undefined;
  /** Position and width as percentages of the domain, after clipping. */
  startPct: number;
  widthPct: number;
};

export type SpanTree<T> = {
  domain: [number, number];
  groups: Array<{ key: string; color: string }>;
  ticks: Array<{ value: number; pct: number; label: string }>;
  /** Depth first, parents before their children, collapsed subtrees left out. */
  rows: SpanRow<T>[];
};

/**
 * Build the tree of spans and place each on a shared time scale. The
 * critical path runs from each root through whichever child ends last.
 */
export function buildSpans<T>(
  rows: ReadonlyArray<T>,
  options: SpanOptions<T>,
): SpanTree<T>;
