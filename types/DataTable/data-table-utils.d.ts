/**
 * Lightweight deep equality check optimized for DataTable rows.
 * Compares arrays of row objects by first checking IDs (fast path),
 * then falling back to deep object comparison to handle nested structures.
 */
export function rowsEqual<Row extends Record<string, any>>(
  a: ReadonlyArray<Row> | null,
  b: ReadonlyArray<Row> | null,
): boolean;
