export interface ImportTable {
  headers: string[];
  /** Every row has `headers.length` cells. */
  rows: string[][];
  /** Rows that had fewer cells than the header, padded with empty ones. */
  short: number;
  /** Rows with more cells than the header, by index, with the cell count they had. */
  long: Map<number, number>;
}

/**
 * Turn parsed records into a header and rectangular rows. Blank and repeated
 * header names get unique names. A short row is padded; a long row keeps its
 * first cells and is reported in `long`.
 */
export function toTable(
  records: ReadonlyArray<ReadonlyArray<string>>,
  options?: { hasHeader?: boolean },
): ImportTable;
