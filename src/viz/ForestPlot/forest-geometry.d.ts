export type ForestOverall = {
  estimate: number;
  lo: number;
  hi: number;
  label?: string;
};

export type ForestOptions<T> = {
  label: (row: T, index: number) => unknown;
  estimate: (row: T, index: number) => unknown;
  lo: (row: T, index: number) => unknown;
  hi: (row: T, index: number) => unknown;
  /** Sizes the marker. */
  weight?: (row: T, index: number) => unknown;
  overall?: ForestOverall | null;
  /** The value of no effect: 1 for a ratio, 0 for a difference. */
  nullValue?: number;
  scale?: "linear" | "log";
  plotWidth: number;
  rowHeight: number;
  /** The smallest and largest marker, in pixels. */
  markerSize?: [number, number];
};

export type ForestRow<T> = {
  index: number;
  /** Position among the rows drawn. */
  order: number;
  row: T;
  label: string;
  estimate: number;
  lo: number;
  hi: number;
  weight: number;
  y: number;
  x: number;
  x0: number;
  x1: number;
  size: number;
  /** Whether the interval excludes the null value. */
  clear: boolean;
};

export type Forest<T> = {
  rows: ForestRow<T>[];
  overall:
    | (ForestOverall & {
        label: string;
        y: number;
        x: number;
        x0: number;
        x1: number;
        d: string;
        clear: boolean;
      })
    | null;
  nullX: number | null;
  ticks: Array<{ value: number; x: number }>;
  domain: [number, number];
  log: boolean;
  height: number;
};

/** A row per study on one shared scale, with the pooled diamond. */
export function buildForest<T>(
  rows: ReadonlyArray<T>,
  options: ForestOptions<T>,
): Forest<T>;
