// @ts-check

/**
 * @typedef {"env" | "headers" | "json"} KeyValueSyntax
 * @typedef {Object} ParsedEntry
 * @property {string} key
 * @property {string} value
 * @property {number} line - 1-based line, or for JSON the 1-based entry number.
 * @property {boolean} [enabled] - `false` for a commented-out entry read with `disabledComments`.
 * @typedef {"no-separator" | "empty-key" | "unterminated-quote" | "trailing-characters" | "invalid-json" | "not-an-object" | "nested-value" | "too-large"} ParseErrorCode
 * @typedef {Object} ParseError
 * @property {number} line - 1-based line, or for JSON the 1-based entry number; `0` for the whole text.
 * @property {ParseErrorCode} code
 * @typedef {Object} ParseResult
 * @property {ParsedEntry[]} entries
 * @property {ParseError[]} errors
 * @property {KeyValueSyntax} syntax
 * @property {boolean} truncated - `true` when `maxEntries` cut the list short.
 * @typedef {Object} ParseOptions
 * @property {number} [maxLength] - Longest text to read, in UTF-16 units. Default `1000000`.
 * @property {number} [maxEntries] - Most entries to return. Default `5000`.
 * @property {boolean} [disabledComments] - Read `# KEY=value` as a disabled entry. Default `false`.
 */

export const DEFAULT_MAX_LENGTH = 1_000_000;
export const DEFAULT_MAX_ENTRIES = 5000;

// A quoted value may run over many lines (a certificate, a private key). The
// cap keeps a stray quote from scanning to the end of a large paste.
const MAX_QUOTED_LINES = 1000;

const ENV_KEY_START = /^(?:export[ \t]+)?[A-Za-z_][\w.-]*[ \t]*=/;
const HEADER_START = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+[ \t]*:[ \t]/;
const SAFE_UNQUOTED = /^[A-Za-z0-9_@%+=:,./-]+$/;
const BOM = /^\uFEFF/;
const LINE_BREAKS = /\r\n?/g;
const EXPORT_PREFIX = /^export[ \t]+/;
const EXPORT_AS_KEY = /^export[ \t]*=/;
const INLINE_COMMENT = /\s#/;
const COMMENT_MARKS = /^#+[ \t]*/;
const COMMENTED_HEADER = /^:?[^\s:]+[ \t]*:[ \t]/;
const LEADING_SPACE = /^[ \t]/;
const HEADER_LIKE = /^[^\s:]+[ \t]*:/;
const WRITABLE_ENV_KEY = /^[^\s=#'"`]+$/;
const WRITABLE_HEADER_NAME = /^:?[^\s:]+$/;
const HEADER_VALUE_BREAKS = /[\r\n\0]+/g;
const ENV_UNESCAPE = /\\([nrt"\\])/g;
const ENV_ESCAPE = /[\\"\n\r\t]/g;
const ENV_ESCAPED = {
  "\\": "\\\\",
  '"': '\\"',
  "\n": "\\n",
  "\r": "\\r",
  "\t": "\\t",
};
const ENV_ESCAPES = { n: "\n", r: "\r", t: "\t", '"': '"', "\\": "\\" };

/** @param {string} text */
function toLines(text) {
  return text.replace(BOM, "").replace(LINE_BREAKS, "\n").split("\n");
}

/**
 * @param {KeyValueSyntax} syntax
 * @returns {ParseResult}
 */
function emptyResult(syntax) {
  return { entries: [], errors: [], syntax, truncated: false };
}

/**
 * @param {string} text
 * @param {KeyValueSyntax} syntax
 * @param {number} maxLength
 * @returns {ParseResult | undefined}
 */
function rejectLarge(text, syntax, maxLength) {
  if (text.length <= maxLength) return undefined;
  return {
    entries: [],
    errors: [{ line: 0, code: "too-large" }],
    syntax,
    truncated: false,
  };
}

/**
 * Read a quoted value that starts at `lines[start]`, past the opening quote at
 * `col`. Returns `undefined` when no closing quote follows.
 *
 * @param {string[]} lines
 * @param {number} start
 * @param {string} first - The first line, from the opening quote on.
 * @param {string} quote
 * @returns {{ raw: string, rest: string, endLine: number } | undefined}
 */
function readQuoted(lines, start, first, quote) {
  /** @type {string[]} */
  const parts = [];
  let lineIndex = start;
  let line = first;
  let col = 1;
  for (;;) {
    let close = -1;
    for (let i = col; i < line.length; i++) {
      const char = line[i];
      if (quote === '"' && char === "\\") i++;
      else if (char === quote) {
        close = i;
        break;
      }
    }
    if (close >= 0) {
      parts.push(line.slice(col, close));
      return {
        raw: parts.join("\n"),
        rest: line.slice(close + 1),
        endLine: lineIndex,
      };
    }
    parts.push(line.slice(col));
    lineIndex++;
    if (lineIndex >= lines.length || lineIndex - start > MAX_QUOTED_LINES) {
      return undefined;
    }
    line = lines[lineIndex];
    col = 0;
  }
}

/**
 * Parse `.env` text: `KEY=value` lines, an optional `export ` prefix, `#`
 * comments, single, double and backtick quotes, and quoted values that span
 * lines. In double quotes `\n`, `\r`, `\t`, `\"` and `\\` are escapes; other
 * quotes are literal. An unquoted value ends at ` #`. A key is read as
 * written: validation, not the parser, decides whether it is acceptable.
 * A line that cannot be read is reported and the rest is still parsed.
 *
 * @param {string} text
 * @param {ParseOptions} [options]
 * @returns {ParseResult}
 */
export function parseDotenv(text, options = {}) {
  const {
    maxLength = DEFAULT_MAX_LENGTH,
    maxEntries = DEFAULT_MAX_ENTRIES,
    disabledComments = false,
  } = options;
  const rejected = rejectLarge(text, "env", maxLength);
  if (rejected) return rejected;

  const result = emptyResult("env");
  const lines = toLines(text);
  /**
   * @param {number} index
   * @param {string} body - The line without leading whitespace.
   * @param {boolean} quiet - Report nothing; used for commented-out entries.
   * @returns {number} The index of the last line the entry used.
   */
  function readEntry(index, body, quiet) {
    const line = index + 1;
    let source = body;
    if (EXPORT_PREFIX.test(source) && !EXPORT_AS_KEY.test(source)) {
      source = source.replace(EXPORT_PREFIX, "");
    }
    const eq = source.indexOf("=");
    if (eq === -1) {
      if (!quiet) result.errors.push({ line, code: "no-separator" });
      return index;
    }
    const key = source.slice(0, eq).trimEnd();
    if (key === "") {
      if (!quiet) result.errors.push({ line, code: "empty-key" });
      return index;
    }
    const afterEquals = source.slice(eq + 1);
    const valueText = afterEquals.trimStart();
    const quote = valueText[0];
    /** @type {string} */
    let value;
    let endLine = index;

    if (quote === '"' || quote === "'" || quote === "`") {
      const read = readQuoted(lines, index, valueText, quote);
      if (!read) {
        if (!quiet) result.errors.push({ line, code: "unterminated-quote" });
        return index;
      }
      const rest = read.rest.trim();
      if (rest !== "" && rest[0] !== "#") {
        if (!quiet) result.errors.push({ line, code: "trailing-characters" });
        return read.endLine;
      }
      value =
        quote === '"'
          ? read.raw.replace(
              ENV_UNESCAPE,
              (_, char) =>
                ENV_ESCAPES[/** @type {keyof typeof ENV_ESCAPES} */ (char)],
            )
          : read.raw;
      endLine = read.endLine;
    } else {
      const comment = afterEquals.search(INLINE_COMMENT);
      value = (
        comment === -1 ? afterEquals : afterEquals.slice(0, comment)
      ).trim();
    }

    /** @type {ParsedEntry} */
    const entry = { key, value, line };
    if (quiet) entry.enabled = false;
    result.entries.push(entry);
    return endLine;
  }

  for (let i = 0; i < lines.length; i++) {
    if (result.entries.length >= maxEntries) {
      result.truncated = true;
      break;
    }
    const body = lines[i].trimStart();
    if (body === "") continue;
    if (body[0] === "#") {
      if (disabledComments) {
        const commented = body.replace(COMMENT_MARKS, "");
        if (ENV_KEY_START.test(commented)) {
          const before = result.entries.length;
          const errorsBefore = result.errors.length;
          const last = readEntry(i, commented, true);
          if (result.entries.length > before) i = last;
          result.errors.length = errorsBefore;
        }
      }
      continue;
    }
    i = readEntry(i, body, false);
  }
  return result;
}

/**
 * Parse `Name: value` header lines. Splits at the first colon, trims the
 * value, joins an indented continuation line onto the line above, and skips
 * blank lines and `#` comments. A `:authority`-style pseudo-header keeps its
 * leading colon.
 *
 * @param {string} text
 * @param {ParseOptions} [options]
 * @returns {ParseResult}
 */
export function parseHeaders(text, options = {}) {
  const {
    maxLength = DEFAULT_MAX_LENGTH,
    maxEntries = DEFAULT_MAX_ENTRIES,
    disabledComments = false,
  } = options;
  const rejected = rejectLarge(text, "headers", maxLength);
  if (rejected) return rejected;

  const result = emptyResult("headers");
  const lines = toLines(text);
  /** @type {ParsedEntry | undefined} */
  let previous;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = i + 1;
    let body = raw.trim();
    if (body === "") {
      previous = undefined;
      continue;
    }
    let enabled = true;
    if (body[0] === "#") {
      if (!disabledComments) continue;
      body = body.replace(COMMENT_MARKS, "");
      if (!COMMENTED_HEADER.test(body)) continue;
      enabled = false;
    }

    const indented = LEADING_SPACE.test(raw);
    if (indented && previous && !HEADER_LIKE.test(body)) {
      previous.value = `${previous.value} ${body}`.trim();
      continue;
    }

    const colon = body.indexOf(":", body[0] === ":" ? 1 : 0);
    if (colon === -1) {
      result.errors.push({ line, code: "no-separator" });
      previous = undefined;
      continue;
    }
    const key = body.slice(0, colon).trimEnd();
    if (key === "" || key === ":") {
      result.errors.push({ line, code: "empty-key" });
      previous = undefined;
      continue;
    }
    if (result.entries.length >= maxEntries) {
      result.truncated = true;
      break;
    }
    /** @type {ParsedEntry} */
    const entry = { key, value: body.slice(colon + 1).trim(), line };
    if (!enabled) entry.enabled = false;
    result.entries.push(entry);
    previous = entry;
  }
  return result;
}

/**
 * @param {unknown} value
 * @returns {string | undefined} `undefined` for an object or array.
 */
function scalarToString(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return undefined;
  return String(value);
}

/**
 * Parse a JSON object (`{"A": "1"}`) or an array of pairs
 * (`[{"key": "A", "value": "1"}]`, also `Key`/`Value` and `name`/`value`).
 * A number, boolean or `null` becomes its text (`null` is empty); a nested
 * object or array is reported. Keys such as `__proto__` are plain data.
 *
 * @param {string} text
 * @param {ParseOptions} [options]
 * @returns {ParseResult}
 */
export function parseJson(text, options = {}) {
  const { maxLength = DEFAULT_MAX_LENGTH, maxEntries = DEFAULT_MAX_ENTRIES } =
    options;
  const rejected = rejectLarge(text, "json", maxLength);
  if (rejected) return rejected;

  const result = emptyResult("json");
  /** @type {unknown} */
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    result.errors.push({ line: 0, code: "invalid-json" });
    return result;
  }
  if (data === null || typeof data !== "object") {
    result.errors.push({ line: 0, code: "not-an-object" });
    return result;
  }

  /** @type {[unknown, unknown, boolean | undefined][]} */
  const pairs = [];
  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      if (item === null || typeof item !== "object" || Array.isArray(item)) {
        result.errors.push({ line: index + 1, code: "not-an-object" });
        pairs.push([undefined, undefined, undefined]);
        return;
      }
      const record = /** @type {Record<string, unknown>} */ (item);
      const key = record.key ?? record.Key ?? record.name ?? record.Name;
      const value = record.value ?? record.Value;
      const enabled =
        typeof record.enabled === "boolean"
          ? record.enabled
          : typeof record.disabled === "boolean"
            ? !record.disabled
            : undefined;
      pairs.push([key, value, enabled]);
    });
  } else {
    for (const [key, value] of Object.entries(data)) {
      pairs.push([key, value, undefined]);
    }
  }

  for (let i = 0; i < pairs.length; i++) {
    const [key, rawValue, enabled] = pairs[i];
    if (key === undefined && rawValue === undefined) continue;
    const line = i + 1;
    if (typeof key !== "string" || key === "") {
      result.errors.push({ line, code: "empty-key" });
      continue;
    }
    const value = scalarToString(rawValue);
    if (value === undefined) {
      result.errors.push({ line, code: "nested-value" });
      continue;
    }
    if (result.entries.length >= maxEntries) {
      result.truncated = true;
      break;
    }
    /** @type {ParsedEntry} */
    const entry = { key, value, line };
    if (enabled === false) entry.enabled = false;
    result.entries.push(entry);
  }
  return result;
}

/**
 * Guess the syntax of pasted text: JSON when it parses as an object or array,
 * `.env` when the first line is `KEY=...`, headers when it is `Name: ...`.
 * Returns `undefined` for text that is none of them (a plain word, a prose
 * sentence), so a pasted key is not mistaken for an import.
 *
 * @param {string} text
 * @returns {KeyValueSyntax | undefined}
 */
export function detectSyntax(text) {
  const trimmed = text.replace(BOM, "").trim();
  if (trimmed === "") return undefined;
  if (trimmed[0] === "{" || trimmed[0] === "[") {
    try {
      const data = JSON.parse(trimmed);
      if (data !== null && typeof data === "object") return "json";
    } catch {
      // Not JSON; try the line formats.
    }
  }
  for (const raw of toLines(trimmed)) {
    const line = raw.trim();
    if (line === "" || line[0] === "#") continue;
    if (ENV_KEY_START.test(line)) return "env";
    if (HEADER_START.test(line)) return "headers";
    return undefined;
  }
  return undefined;
}

/**
 * Parse text as `syntax`, or let the text decide with `"auto"`.
 * Text with no recognizable syntax gives an empty result (syntax `"env"`).
 *
 * @param {string} text
 * @param {KeyValueSyntax | "auto"} [syntax]
 * @param {ParseOptions} [options]
 * @returns {ParseResult}
 */
export function parseKeyValue(text, syntax = "auto", options = {}) {
  const resolved = syntax === "auto" ? detectSyntax(text) : syntax;
  if (resolved === "json") return parseJson(text, options);
  if (resolved === "headers") return parseHeaders(text, options);
  if (resolved === "env") return parseDotenv(text, options);
  return emptyResult("env");
}

/**
 * @typedef {Object} SerializableRow
 * @property {string} key
 * @property {string} value
 * @property {boolean} [enabled]
 * @property {boolean} [stored]
 */

/**
 * @typedef {Object} SerializeOptions
 * @property {"skip" | "comment"} [disabled] - What to do with a row whose `enabled` is `false`. Default `"skip"`.
 * @property {boolean} [array] - JSON only: write `[{ "key", "value" }]` so duplicate keys and order survive. Default `false`.
 */

/**
 * @param {SerializableRow} row
 * @param {SerializeOptions} options
 */
function included(row, options) {
  if (row.key === "" || row.stored) return false;
  return row.enabled !== false || options.disabled === "comment";
}

/**
 * Write rows as `.env` lines. A value is quoted (double quotes, with `\n`,
 * `\r`, `\t`, `\"` and `\\` escaped) unless it is plain, so a value can never
 * add a line. A row is left out when it is blank, `stored` (its value is not
 * known), disabled (unless `disabled: "comment"`), or its key cannot be
 * written (it has whitespace, `=`, `#` or a quote).
 *
 * @param {ReadonlyArray<SerializableRow>} rows
 * @param {SerializeOptions} [options]
 * @returns {string}
 */
export function serializeDotenv(rows, options = {}) {
  const lines = [];
  for (const row of rows) {
    if (!included(row, options) || !WRITABLE_ENV_KEY.test(row.key)) continue;
    const value = row.value ?? "";
    const text =
      value === "" || SAFE_UNQUOTED.test(value)
        ? value
        : `"${value.replace(ENV_ESCAPE, (char) => ENV_ESCAPED[/** @type {keyof typeof ENV_ESCAPED} */ (char)])}"`;
    lines.push(`${row.enabled === false ? "# " : ""}${row.key}=${text}`);
  }
  return lines.join("\n");
}

/**
 * Write rows as `Name: value` lines. Line breaks and NUL in a value become a
 * space, so a value can never add a header. Rows whose name has whitespace or
 * a colon are left out, as are blank, `stored` and (unless
 * `disabled: "comment"`) disabled rows.
 *
 * @param {ReadonlyArray<SerializableRow>} rows
 * @param {SerializeOptions} [options]
 * @returns {string}
 */
export function serializeHeaders(rows, options = {}) {
  const lines = [];
  for (const row of rows) {
    if (!included(row, options)) continue;
    if (!WRITABLE_HEADER_NAME.test(row.key)) continue;
    const value = (row.value ?? "").replace(HEADER_VALUE_BREAKS, " ").trim();
    lines.push(
      `${row.enabled === false ? "# " : ""}${row.key}: ${value}`.trimEnd(),
    );
  }
  return lines.join("\n");
}

/**
 * Write rows as JSON: an object (the last of a repeated key wins), or with
 * `array: true` a list of `{ key, value }`. Disabled, blank and `stored` rows
 * are left out.
 *
 * @param {ReadonlyArray<SerializableRow>} rows
 * @param {SerializeOptions} [options]
 * @returns {string}
 */
export function serializeJson(rows, options = {}) {
  const used = rows.filter(
    (row) => row.key !== "" && !row.stored && row.enabled !== false,
  );
  if (options.array) {
    return JSON.stringify(
      used.map((row) => ({ key: row.key, value: row.value ?? "" })),
      null,
      2,
    );
  }
  const record = {};
  for (const row of used) {
    Object.defineProperty(record, row.key, {
      value: row.value ?? "",
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  return JSON.stringify(record, null, 2);
}

/**
 * Write rows in `syntax`.
 *
 * @param {ReadonlyArray<SerializableRow>} rows
 * @param {KeyValueSyntax} syntax
 * @param {SerializeOptions} [options]
 * @returns {string}
 */
export function serializeKeyValue(rows, syntax, options = {}) {
  if (syntax === "json") return serializeJson(rows, options);
  if (syntax === "headers") return serializeHeaders(rows, options);
  return serializeDotenv(rows, options);
}
