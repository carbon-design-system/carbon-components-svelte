/**
 * Set intersections for an UpSet plot.
 */
export type UpSetOptions<T> = {
  /** The sets, in the order their columns appear. */
  sets: ReadonlyArray<{ id: string | number; label?: string }>;
  /** The ids of the sets a row belongs to. */
  membership: (row: T, index: number) => unknown;
  /** Largest first, or fewest sets first. @default "size" */
  sort?: "size" | "degree";
  /** Include combinations no row falls in. @default false */
  showEmpty?: boolean;
  /** Keep only the first this many combinations after sorting. */
  maxCombinations?: number;
};

export type UpSetCombination<T> = {
  /** The set ids joined with `+`, in set order. */
  key: string;
  ids: string[];
  /** How many sets the combination involves. */
  degree: number;
  size: number;
  /** Share of every row that is in at least one set, 0 to 1. */
  share: number;
  /** Bar length, 0 to 100, relative to the largest combination. */
  pct: number;
  rows: T[];
};

export type UpSet<T> = {
  sets: Array<{ id: string; label: string; total: number; pct: number }>;
  combinations: UpSetCombination<T>[];
  /** Rows in at least one set. */
  counted: number;
};

/** Count rows by the exact combination of sets they belong to. */
export function upset<T>(
  rows: ReadonlyArray<T>,
  options: UpSetOptions<T>,
): UpSet<T>;
