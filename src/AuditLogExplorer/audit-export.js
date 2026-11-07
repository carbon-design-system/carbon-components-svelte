// @ts-check

/**
 * @typedef {import("./audit-source.js").AuditEvent} AuditEvent
 */

export const CSV_COLUMNS = /** @type {const} */ ([
  "id",
  "time",
  "actor",
  "action",
  "target",
  "outcome",
  "ip",
  "payload",
]);

const FORMULA_START = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /[",\r\n]/;
const QUOTE = /"/g;

/**
 * One CSV cell. Quotes a value that holds a comma, a quote or a line break,
 * and puts a `'` before one a spreadsheet would run as a formula (`=`, `+`,
 * `-`, `@`, tab, carriage return): an audit log holds text anyone could
 * choose, such as a user agent or a resource name.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function csvCell(value) {
  let text =
    typeof value === "string"
      ? value
      : value === undefined || value === null
        ? ""
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  return NEEDS_QUOTES.test(text) ? `"${text.replace(QUOTE, '""')}"` : text;
}

/**
 * Events as CSV, with a header row. The payload is one JSON cell.
 *
 * @param {ReadonlyArray<AuditEvent>} events
 * @returns {string}
 */
export function toCsv(events) {
  const lines = [CSV_COLUMNS.join(",")];
  for (const event of events) {
    lines.push(CSV_COLUMNS.map((column) => csvCell(event[column])).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

/**
 * Events as a JSON array, one event per line so a large export streams into
 * `jq` and diffs well.
 *
 * @param {ReadonlyArray<AuditEvent>} events
 * @returns {string}
 */
export function toJson(events) {
  if (events.length === 0) return "[]\n";
  return `[\n${events.map((event) => `  ${JSON.stringify(event)}`).join(",\n")}\n]\n`;
}

/**
 * Walk a source's pages for a query until `limit` events are read or the
 * source runs out. Aborting rejects with an `AbortError`.
 *
 * @param {import("./audit-source.js").AuditSource} source
 * @param {Omit<import("./audit-source.js").AuditQuery, "cursor" | "limit" | "facets">} query
 * @param {{ limit?: number, pageSize?: number, onProgress?: (count: number) => void }} [options]
 * @returns {Promise<{ events: AuditEvent[], truncated: boolean }>}
 */
export async function collectEvents(source, query, options = {}) {
  const limit = options.limit ?? 10_000;
  const pageSize = Math.min(options.pageSize ?? 500, limit);
  /** @type {AuditEvent[]} */
  const events = [];
  /** @type {string | null | undefined} */
  let cursor;
  for (;;) {
    // biome-ignore lint/performance/noAwaitInLoops: each cursor comes from the last page
    const page = await source.query({
      ...query,
      cursor,
      limit: Math.min(pageSize, limit - events.length),
    });
    events.push(...page.events);
    options.onProgress?.(events.length);
    if (!page.nextCursor) return { events, truncated: false };
    if (events.length >= limit) return { events, truncated: true };
    cursor = page.nextCursor;
  }
}
