import type { VizColor } from "./tokens.js";

type Accessor<T> = (row: T, index: number) => unknown;

/** Group keys in first-seen order, as strings. Empty without a group accessor. */
export function listGroups<T>(
  rows: ReadonlyArray<T>,
  groupOf: Accessor<T> | undefined,
): string[];

/** A stable color per key from the palette, overridden by `fixed`. */
export function colorGroups(
  keys: ReadonlyArray<string>,
  palette: number,
  fixed: Record<string, VizColor>,
): Record<string, string>;

/** The rows whose group is not hidden. */
export function dropGroups<T>(
  rows: ReadonlyArray<T>,
  groupOf: Accessor<T> | undefined,
  hidden: ReadonlySet<string>,
): ReadonlyArray<T>;

/** The rows of a hierarchy left once hidden groups and their subtrees are pruned. */
export function pruneGroups<T>(
  rows: ReadonlyArray<T>,
  idOf: Accessor<T>,
  parentOf: Accessor<T>,
  groupOf: Accessor<T> | undefined,
  hidden: ReadonlySet<string>,
): ReadonlyArray<T>;

/** The hidden list after toggling `key`, or `null` when that would hide the last visible group. */
export function nextHidden(
  hidden: ReadonlyArray<string | number>,
  key: string,
  total: number,
): Array<string | number> | null;

/** For a hierarchy colored by branch: an accessor from a row to the id of its ancestor just under the center. */
export function branchAccessor<T>(
  rows: ReadonlyArray<T>,
  idOf: Accessor<T>,
  parentOf: Accessor<T>,
  root: string | number | null | undefined,
): (row: T, index: number) => string;
