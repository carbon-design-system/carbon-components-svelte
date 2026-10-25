// @ts-check
// CSV export of a chart's series, in the same long format the chart reads.

const NEEDS_QUOTES = /[",\r\n]/;
const QUOTE = /"/g;
// Leading characters a spreadsheet reads as the start of a formula.
const FORMULA = /^[=+\-@\t\r]/;

/**
 * Quote a field when it contains a comma, a quote, or a line break.
 *
 * @param {unknown} value
 * @returns {string}
 */
function field(value) {
  const raw = value === null || value === undefined ? "" : String(value);
  // A label that starts like a formula gets a quote in front, as a
  // spreadsheet's own export does, so opening the file runs nothing.
  const text = typeof value === "string" && FORMULA.test(raw) ? `'${raw}` : raw;
  return NEEDS_QUOTES.test(text) ? `"${text.replace(QUOTE, '""')}"` : text;
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
  const {
    kind = "linear",
    categories = [],
    header = ["x", "series", "y"],
    range = null,
  } = options;
  const lines = [header.map(field).join(",")];
  for (const group of groups) {
    if (group.hidden || group.ghost !== undefined) continue;
    for (let i = 0; i < group.xs.length; i++) {
      const raw = group.xs[i];
      if (range && (raw < range[0] || raw > range[1])) continue;
      const x =
        kind === "time"
          ? new Date(raw).toISOString()
          : kind === "category"
            ? (categories[raw] ?? "")
            : raw;
      const y = group.ys[i];
      lines.push(
        [x, group.key, Number.isFinite(y) ? y : ""].map(field).join(","),
      );
    }
  }
  return `${lines.join("\r\n")}\r\n`;
}
