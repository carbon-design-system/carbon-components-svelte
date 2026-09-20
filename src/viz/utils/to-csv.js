// @ts-check
// CSV export of a chart's series, in the same long format the chart reads.

const NEEDS_QUOTES = /[",\r\n]/;
const QUOTE = /"/g;

/**
 * Quote a field when it contains a comma, a quote, or a line break.
 *
 * @param {unknown} value
 * @returns {string}
 */
function field(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return NEEDS_QUOTES.test(text) ? `"${text.replace(QUOTE, '""')}"` : text;
}

/**
 * CSV text with one row per x and series. Values are unformatted so the file
 * round-trips: dates are ISO 8601, numbers are plain, and a missing value is
 * an empty field. Hidden series are left out, as in the chart.
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
  } = options;
  const lines = [header.map(field).join(",")];
  for (const group of groups) {
    if (group.hidden) continue;
    for (let i = 0; i < group.xs.length; i++) {
      const raw = group.xs[i];
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
