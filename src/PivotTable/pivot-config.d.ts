import type {
  PivotAggregateName,
  PivotConfig,
  PivotDimension,
  PivotFilter,
  PivotValue,
} from "./pivot.js";

export type PivotZone = "available" | "rows" | "columns" | "values" | "filters";

export type PivotField = {
  /** The record field. */
  key: string;
  /** Defaults to the key. */
  label?: string;
  /** A `"number"` field is summed when it first joins the values; any other is counted. */
  type?: "string" | "number" | "date" | "boolean";
};

export type PivotMove = {
  field: string;
  from: PivotZone;
  to: PivotZone;
  /** The index in `from`. Needed to take one of several values. */
  fromIndex?: number;
  /** The gap to insert at in `to`, counted before the field is taken out. Defaults to the end. */
  toIndex?: number;
};

export const PIVOT_ZONES: PivotZone[];

export function fieldOf(
  entry: string | PivotDimension | PivotValue | PivotFilter,
): string | undefined;

/**
 * The entries of a zone in order. `available` lists the fields that are in
 * no dimension zone, so a field can be a value and still be offered.
 */
export function zoneEntries(
  config: PivotConfig,
  fields: ReadonlyArray<PivotField>,
  zone: PivotZone,
  // biome-ignore lint/suspicious/noExplicitAny: an entry is a key or an object
): { field: string; entry: any }[];

/**
 * Move a field to another zone, or to another place in its zone. A row,
 * column or filter field sits in one of the three at a time; a value can
 * repeat. The entry keeps what it carries (a dimension's sort, a value's
 * aggregate) while it moves between zones that hold the same kind.
 */
export function moveField(
  config: PivotConfig,
  move: PivotMove,
  fields?: ReadonlyArray<PivotField>,
): PivotConfig;

/** Swap an entry of a zone with its neighbor. */
export function shiftEntry(
  config: PivotConfig,
  zone: Exclude<PivotZone, "available">,
  index: number,
  step: -1 | 1,
): PivotConfig;

/** Set how a value is aggregated. */
export function setAggregate(
  config: PivotConfig,
  index: number,
  aggregate: PivotValue["aggregate"] | PivotAggregateName,
): PivotConfig;

/** Keep the records whose `field` is one of `include`, or all with `undefined`. */
export function setFilterInclude(
  config: PivotConfig,
  field: string,
  include: unknown[] | undefined,
): PivotConfig;

/** The distinct values of a field, in first-seen order, up to `limit`. */
export function distinctValues(
  // biome-ignore lint/suspicious/noExplicitAny: records are the consumer's
  records: ReadonlyArray<any>,
  field: string,
  limit?: number,
): { values: unknown[]; blank: boolean; truncated: boolean };
