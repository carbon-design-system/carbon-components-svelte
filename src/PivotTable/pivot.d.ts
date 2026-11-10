export type PivotAggregateName =
  "sum" | "count" | "avg" | "min" | "max" | "countDistinct";

export type PivotValue = {
  /** The record field to aggregate. Omit it with `aggregate: "count"` to count records. */
  field?: string;
  /**
   * Defaults to `"sum"`. A function receives the field values (blank ones
   * removed) of every record in the cell, and in a subtotal of every record
   * under it.
   */
  aggregate?:
    | PivotAggregateName
    // biome-ignore lint/suspicious/noExplicitAny: record values are unknown
    | ((values: any[]) => number | null | undefined);
  /** The header text. Defaults to "Sum of Amount". */
  label?: string;
  /** Passed to `Intl.NumberFormat`. */
  format?: Intl.NumberFormatOptions;
};

export type PivotSort = {
  /** Defaults to `"label"`. `"value"` orders groups by the aggregate across the whole other axis. */
  by?: "label" | "value";
  /** Defaults to `"asc"`. Blank groups are last either way. */
  direction?: "asc" | "desc";
  /** The index in `values` that `by: "value"` reads. Defaults to `0`. */
  value?: number;
};

export type PivotDimension = {
  /** The record field. A dotted path such as `"contact.city"` is resolved. */
  field: string;
  /** The name of the field in headers. */
  label?: string;
  /** Maps a field value to the value to group by, for example a date to its quarter. */
  // biome-ignore lint/suspicious/noExplicitAny: record values are unknown
  group?: (value: any, record: any) => unknown;
  /** Maps a group's value to its label. Defaults to `String(key)`. */
  // biome-ignore lint/suspicious/noExplicitAny: group values are unknown
  formatKey?: (key: any) => string;
  sort?: PivotSort;
};

export type PivotFilter = {
  field: string;
  /** Keep records whose value is one of these. `null` matches a blank value. */
  include?: unknown[];
  /** Drop records whose value is one of these. */
  exclude?: unknown[];
};

export type PivotConfig = {
  /** Row fields, outermost first. */
  rows?: (string | PivotDimension)[];
  /** Column fields, outermost first. */
  columns?: (string | PivotDimension)[];
  values?: PivotValue[];
  filters?: PivotFilter[];
};

export type PivotOptions = {
  /** Orders labels, with numbers numerically. */
  locale?: string;
  /** The label of the group for a missing value. Defaults to `"(blank)"`. */
  blankLabel?: string;
  /** Field labels for headers, by field key. A dimension's or value's own `label` wins. */
  labels?: Record<string, string>;
  /** Throw a `RangeError` when row nodes x column nodes x values exceeds this. Defaults to `1000000`. */
  maxCells?: number;
};

export type PivotNode = {
  /** Stable across data changes: the path of keys from the root. `""` for the grand total. */
  id: string;
  /** The group value, `null` for blank. */
  key: unknown;
  label: string;
  blank: boolean;
  /** The field this node groups by, `""` for the grand total. */
  field: string;
  /** `-1` for the grand total, `0` for the outermost groups. */
  level: number;
  /** Position in the result's storage. Not the display order. */
  index: number;
  /** `index` of the parent, `-1` for the grand total. */
  parent: number;
  /** Empty for a leaf. Sorted. */
  children: PivotNode[];
  /** Records under it. */
  count: number;
  lo: number;
  hi: number;
};

export type PivotValueSpec = {
  field: string | undefined;
  aggregate: PivotAggregateName | "custom";
  label: string;
  format: Intl.NumberFormatOptions | undefined;
};

export type PivotResult = {
  /** The grand total row; its `children` are the outermost row groups. */
  rowRoot: PivotNode;
  columnRoot: PivotNode;
  /** Every row node by `index`. */
  rowNodes: PivotNode[];
  columnNodes: PivotNode[];
  rowFields: { field: string; label: string }[];
  columnFields: { field: string; label: string }[];
  values: PivotValueSpec[];
  /** Records that passed the filters. */
  recordCount: number;
  /** The aggregate, `null` where no record falls. */
  get: (row: PivotNode, column: PivotNode, value?: number) => number | null;
  /** The records behind a cell. */
  // biome-ignore lint/suspicious/noExplicitAny: records are the consumer's
  records: (row: PivotNode, column: PivotNode) => any[];
};

/**
 * Group `records` by row and column fields and aggregate `values` for every
 * group, subtotal and grand total.
 */
export function pivot<Row = Record<string, unknown>>(
  records: ReadonlyArray<Row>,
  config: PivotConfig,
  options?: PivotOptions,
): PivotResult;
