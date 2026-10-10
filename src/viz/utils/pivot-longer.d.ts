/**
 * Reshape wide rows into the long format every chart reads.
 */

export type PivotLongerOptions<
  C extends string,
  N extends string = "series",
  V extends string = "value",
> = {
  /** Columns to fold into name and value pairs. */
  cols: ReadonlyArray<C>;
  /** Property that receives the column name. @default "series" */
  namesTo?: N;
  /** Property that receives the column's value. @default "value" */
  valuesTo?: V;
};

/**
 * Turn one row with several value columns into one row per column:
 *
 * `{ month: "Jan", emea: 4, apac: 7 }` with `cols: ["emea", "apac"]` becomes
 * `{ month: "Jan", series: "emea", value: 4 }` and
 * `{ month: "Jan", series: "apac", value: 7 }`.
 *
 * Other properties are copied onto each output row. Output is row-major.
 */
export function pivotLonger<
  T extends Record<string, unknown>,
  C extends keyof T & string,
  N extends string = "series",
  V extends string = "value",
>(
  rows: ReadonlyArray<T>,
  options: PivotLongerOptions<C, N, V>,
): Array<Omit<T, C> & Record<N, C> & Record<V, T[C]>>;
