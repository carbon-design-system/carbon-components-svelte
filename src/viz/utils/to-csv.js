// @ts-check
// CSV export of a chart's series, in the same long format the chart reads.

const QUOTE = /"/g;
const BREAKS_A_FIELD = /["\r\n]/;
// Leading characters a spreadsheet reads as the start of a formula.
const FORMULA = /^[=+\-@\t\r]/;

/**
 * Quote a field when it contains the delimiter, a quote, or a line break.
 *
 * @param {unknown} value
 * @param {string} delimiter
 * @returns {string}
 */
function field(value, delimiter) {
  const raw = value === null || value === undefined ? "" : String(value);
  // A label that starts like a formula gets a quote in front, as a
  // spreadsheet's own export does, so opening the file runs nothing.
  const text = typeof value === "string" && FORMULA.test(raw) ? `'${raw}` : raw;
  return text.includes(delimiter) || BREAKS_A_FIELD.test(text)
    ? `"${text.replace(QUOTE, '""')}"`
    : text;
}

/**
 * The rows a chart shows, in long format: one per x and series, with x as
 * the file would write it. Hidden series, the ghosts of a prior period,
 * and anything outside `range` are left out.
 *
 * @param {ReadonlyArray<import("../Chart/model.js").ChartGroup<any>>} groups
 * @param {import("./to-csv.d.ts").CsvOptions} [options]
 * @returns {Array<{ x: string | number; series: string | number; y: number | null }>}
 */
export function groupsToRows(groups, options = {}) {
  const { kind = "linear", categories = [], range = null } = options;
  /** @type {Array<{ x: string | number; series: string | number; y: number | null }>} */
  const rows = [];
  for (const group of groups) {
    if (group.hidden || group.ghost !== undefined) continue;
    for (let i = 0; i < group.xs.length; i++) {
      const raw = group.xs[i];
      if (range && (raw < range[0] || raw > range[1])) continue;
      const y = group.ys[i];
      rows.push({
        x:
          kind === "time"
            ? new Date(raw).toISOString()
            : kind === "category"
              ? (categories[raw] ?? "")
              : raw,
        series: group.key,
        y: Number.isFinite(y) ? y : null,
      });
    }
  }
  return rows;
}

/**
 * CSV text with one row per x and series. Values are unformatted so the file
 * round-trips: dates are ISO 8601, numbers are plain, and a missing value is
 * an empty field. Hidden series and the ghosts of a prior period are left
 * out, and `range` keeps to the zoom window, so the file holds what the
 * chart shows.
 *
 * @param {ReadonlyArray<import("../Chart/model.js").ChartGroup<any>>} groups
 * @param {import("./to-csv.d.ts").CsvOptions} [options]
 * @returns {string}
 */
export function groupsToCsv(groups, options = {}) {
  const { header = ["x", "series", "y"], delimiter = "," } = options;
  const cell = (/** @type {unknown} */ value) => field(value, delimiter);
  const lines = [header.map(cell).join(delimiter)];
  for (const row of groupsToRows(groups, options)) {
    lines.push([row.x, row.series, row.y ?? ""].map(cell).join(delimiter));
  }
  return `${lines.join("\r\n")}\r\n`;
}
