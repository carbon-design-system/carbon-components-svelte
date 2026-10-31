// @ts-check
// Reshape wide rows into the long format every chart reads.

/**
 * Turn one row with several value columns into one row per column:
 *
 * `{ month: "Jan", emea: 4, apac: 7 }` with `cols: ["emea", "apac"]` becomes
 * `{ month: "Jan", series: "emea", value: 4 }` and
 * `{ month: "Jan", series: "apac", value: 7 }`.
 *
 * Other properties are copied onto each output row. Output is row-major.
 *
 * @param {ReadonlyArray<Record<string, any>>} rows
 * @param {{ cols: ReadonlyArray<string>, namesTo?: string, valuesTo?: string }} options
 * @returns {Array<Record<string, any>>}
 */
export function pivotLonger(
  rows,
  { cols, namesTo = "series", valuesTo = "value" },
) {
  const pivoted = new Set(cols);
  /** @type {Array<Record<string, any>>} */
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    /** @type {Record<string, any>} */
    const rest = {};
    for (const key of Object.keys(row)) {
      if (!pivoted.has(key)) rest[key] = row[key];
    }
    for (let c = 0; c < cols.length; c++) {
      out.push({ ...rest, [namesTo]: cols[c], [valuesTo]: row[cols[c]] });
    }
  }
  return out;
}
