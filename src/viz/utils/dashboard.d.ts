import type { Readable } from "svelte/store";
import type { Accessor } from "./accessor.js";
import type { TimeRange } from "./time-range.js";

export type DashboardFilter = {
  /** A row property, or a key into the `accessors` given to `filterRows`. */
  dimension: string;
  value: unknown;
};

export type DashboardValue = {
  filters: DashboardFilter[];
  /** Series keys the legends have hidden, for charts that sync `"hidden"`. */
  hidden: Array<string | number>;
};

export type DashboardOptions = {
  /** The page's time range, carried for convenience. */
  range?: TimeRange;
};

export type Dashboard = Readable<DashboardValue> & {
  range: TimeRange | undefined;
  /** Add a filter, once. */
  filter(dimension: string, value: unknown): void;
  /** Remove one filter, or every filter on a dimension. */
  unfilter(dimension: string, value?: unknown): void;
  toggleFilter(dimension: string, value: unknown): void;
  clearFilters(): void;
  setHidden(hidden: ReadonlyArray<string | number>): void;
};

/** What a page of charts shares: filters and hidden series, as a store. */
export function createDashboard(options?: DashboardOptions): Dashboard;

/**
 * The rows a dashboard's filters keep: each filter's dimension, read as a
 * property or through `accessors`, must equal its value.
 */
export function filterRows<T>(
  rows: ReadonlyArray<T>,
  filters: ReadonlyArray<DashboardFilter>,
  accessors?: Record<string, Accessor<T, unknown>>,
): T[];

/** The rows whose x falls inside a time range, both ends included. */
export function withinRange<T>(
  rows: ReadonlyArray<T>,
  x: Accessor<T, Date | number>,
  range: { from: Date | number; to: Date | number },
): T[];
