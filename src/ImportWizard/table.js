// @ts-check

/**
 * @typedef {object} ImportTable
 * @property {string[]} headers
 * @property {string[][]} rows - Every row has `headers.length` cells.
 * @property {number} short - Rows that had fewer cells than the header, padded with empty ones.
 * @property {Map<number, number>} long - Rows with more cells than the header, by index, with the cell count they had.
 */

/**
 * Turn parsed records into a header and rectangular rows. Blank and repeated
 * header names get unique names, so every column stays addressable. A short
 * row is padded (spreadsheets drop trailing empty cells); a long row keeps
 * its first cells and is reported in `long`, since the rest would be lost.
 * @param {ReadonlyArray<ReadonlyArray<string>>} records
 * @param {{ hasHeader?: boolean }} [options]
 * @returns {ImportTable}
 */
export function toTable(records, options = {}) {
  const hasHeader = options.hasHeader !== false;
  const body = hasHeader ? 1 : 0;
  let columns = hasHeader ? (records[0] || []).length : 0;
  if (!hasHeader) {
    for (let i = 0; i < Math.min(records.length, 1000); i++) {
      columns = Math.max(columns, records[i].length);
    }
  }
  /** @type {string[]} */
  const headers = [];
  /** @type {Map<string, number>} */
  const seen = new Map();
  for (let c = 0; c < columns; c++) {
    let name = hasHeader ? (records[0][c] || "").trim() : "";
    if (!name) name = `Column ${c + 1}`;
    const count = seen.get(name.toLowerCase()) || 0;
    seen.set(name.toLowerCase(), count + 1);
    headers.push(count ? `${name} (${count + 1})` : name);
  }
  /** @type {string[][]} */
  const rows = [];
  let short = 0;
  /** @type {Map<number, number>} */
  const long = new Map();
  for (let i = body; i < records.length; i++) {
    const record = records[i];
    const index = i - body;
    if (record.length === columns) {
      rows.push(/** @type {string[]} */ (record));
    } else if (record.length < columns) {
      short++;
      const padded = record.slice();
      while (padded.length < columns) padded.push("");
      rows.push(padded);
    } else {
      long.set(index, record.length);
      rows.push(record.slice(0, columns));
    }
  }
  return { headers, rows, short, long };
}
