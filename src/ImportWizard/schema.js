// @ts-check

/**
 * @typedef {object} ImportFieldOption
 * @property {string} value
 * @property {string} [label]
 * @property {ReadonlyArray<string>} [aliases]
 *
 * @typedef {object} ImportField
 * @property {string} key
 * @property {string} label
 * @property {"string" | "number" | "integer" | "boolean" | "date" | "email" | "enum"} [type]
 * @property {boolean} [required]
 * @property {ReadonlyArray<string>} [aliases] - Other names the column may have.
 * @property {ReadonlyArray<string | ImportFieldOption>} [options] - The allowed values of an `enum`.
 * @property {ReadonlyArray<string>} [dateFormats] - Accepted formats of a `date`: `YYYY-MM-DD`, `MM/DD/YYYY`, `DD/MM/YYYY`, `DD.MM.YYYY`, `serial`. Defaults to ISO.
 * @property {"." | ","} [decimal] - The decimal mark of a `number`. Defaults to `.`.
 * @property {number} [minLength]
 * @property {number} [maxLength]
 * @property {number} [min]
 * @property {number} [max]
 * @property {RegExp | string} [pattern]
 * @property {string} [patternMessage]
 * @property {string} [description] - Shown in the mapping step.
 * @property {(value: any, record: Record<string, any>) => string | null | undefined | false | void} [validate] - Return a message for a bad value.
 */

/**
 * @typedef {object} ImportMessages
 * @property {(field: ImportField) => string} required
 * @property {(field: ImportField) => string} number
 * @property {(field: ImportField) => string} integer
 * @property {(field: ImportField) => string} boolean
 * @property {(field: ImportField) => string} date
 * @property {(field: ImportField) => string} email
 * @property {(field: ImportField) => string} enum
 * @property {(field: ImportField, limit: number) => string} minLength
 * @property {(field: ImportField, limit: number) => string} maxLength
 * @property {(field: ImportField, limit: number) => string} min
 * @property {(field: ImportField, limit: number) => string} max
 * @property {(field: ImportField) => string} pattern
 * @property {(row: number) => string} duplicate
 * @property {(found: number, expected: number) => string} extraValues
 */

/** @type {ImportMessages} */
export const defaultMessages = {
  required: (field) => `${field.label} is required`,
  number: () => "Enter a number",
  integer: () => "Enter a whole number",
  boolean: () => "Enter yes or no",
  date: (field) => {
    const format = field.dateFormats?.[0] || "YYYY-MM-DD";
    return `Enter a date as ${format}`;
  },
  email: () => "Enter a valid email address",
  enum: (field) => {
    const list = (field.options || [])
      .map((o) => (typeof o === "string" ? o : o.label || o.value))
      .slice(0, 5)
      .join(", ");
    return `Use one of: ${list}`;
  },
  minLength: (_, limit) => `Use at least ${limit} characters`,
  maxLength: (_, limit) => `Use at most ${limit} characters`,
  min: (_, limit) => `Use ${limit} or more`,
  max: (_, limit) => `Use ${limit} or less`,
  pattern: (field) =>
    field.patternMessage || "Doesn't match the expected format",
  duplicate: (row) => `Duplicate of row ${row}`,
  extraValues: (found, expected) =>
    `Has ${found} values, but the header has ${expected}`,
};

const TRUE = new Set(["true", "yes", "y", "1", "t", "on", "x"]);
const FALSE = new Set(["false", "no", "n", "0", "f", "off"]);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPACES = /[\s\u00a0']/g;
const SIGN = /^[+-]/;
const SCIENTIFIC = /^\d+(\.\d+)?[eE][+-]?\d+$/;
const DATE_ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/;
const DATE_SLASH = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const DATE_DOT = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
const SERIAL = /^\d{1,7}(\.\d+)?$/;

/**
 * Parse a number, with or without thousands separators.
 * @param {string} text
 * @param {"." | ","} [decimal]
 * @returns {number | undefined}
 */
export function parseNumber(text, decimal = ".") {
  const group = decimal === "." ? "," : ".";
  const s = text.replace(SPACES, "");
  const body = s.replace(SIGN, "");
  if (!body) return undefined;
  const pattern = new RegExp(
    `^(\\d{1,3}(\\${group}\\d{3})+|\\d+)(\\${decimal}\\d+)?$|^\\${decimal}\\d+$`,
  );
  if (!pattern.test(body)) {
    return SCIENTIFIC.test(body) ? Number(s) : undefined;
  }
  const n = Number(s.split(group).join("").replace(decimal, "."));
  return Number.isFinite(n) ? n : undefined;
}

/** @param {number} y @param {number} m @param {number} d */
function iso(y, m, d) {
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    y < 1000 ||
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return undefined;
  }
  return date.toISOString().slice(0, 10);
}

/**
 * Parse a date in one of `formats` into `YYYY-MM-DD`. Impossible dates such
 * as 02/30/2024 fail. `serial` accepts a spreadsheet day number.
 * @param {string} text
 * @param {ReadonlyArray<string>} [formats]
 * @returns {string | undefined}
 */
export function parseDate(text, formats = ["YYYY-MM-DD"]) {
  const s = text.trim();
  for (const format of formats) {
    let m;
    if (format === "YYYY-MM-DD") {
      m = DATE_ISO.exec(s);
      if (m) {
        const out = iso(+m[1], +m[2], +m[3]);
        if (out) return out;
      }
    } else if (format === "MM/DD/YYYY") {
      m = DATE_SLASH.exec(s);
      if (m) {
        const out = iso(+m[3], +m[1], +m[2]);
        if (out) return out;
      }
    } else if (format === "DD/MM/YYYY") {
      m = DATE_SLASH.exec(s);
      if (m) {
        const out = iso(+m[3], +m[2], +m[1]);
        if (out) return out;
      }
    } else if (format === "DD.MM.YYYY") {
      m = DATE_DOT.exec(s);
      if (m) {
        const out = iso(+m[3], +m[2], +m[1]);
        if (out) return out;
      }
    } else if (format === "serial" && SERIAL.test(s)) {
      const n = Math.floor(Number(s));
      if (n >= 1) {
        return new Date(Date.UTC(1899, 11, 30) + n * 86400000)
          .toISOString()
          .slice(0, 10);
      }
    }
  }
  return undefined;
}

/** @param {ImportField} field */
function optionList(field) {
  return (field.options || []).map((o) =>
    typeof o === "string" ? { value: o, label: o, aliases: [] } : o,
  );
}

/** @type {WeakMap<ImportField, Map<string, string>>} */
const optionIndexes = new WeakMap();

/**
 * @param {ImportField} field
 * @param {string} text
 * @returns {string | undefined}
 */
function matchOption(field, text) {
  let index = optionIndexes.get(field);
  if (!index) {
    index = new Map();
    for (const o of optionList(field)) {
      for (const name of [o.value, o.label || o.value, ...(o.aliases || [])]) {
        const k = name.toLowerCase();
        if (!index.has(k)) index.set(k, o.value);
      }
    }
    optionIndexes.set(field, index);
  }
  return index.get(text.toLowerCase());
}

/**
 * @typedef {object} CellTransform
 * @property {string} [dateFormat] - Overrides the field's `dateFormats` with one format.
 * @property {Record<string, string>} [valueMap] - Source text (lowercased) to an option value, or `true` / `false` for a boolean.
 * @property {boolean} [trim] - Defaults to `true`.
 */

/**
 * Convert one cell for a field. Returns the value, or the reason it isn't one.
 * An empty cell is `null`.
 * @param {ImportField} field
 * @param {string} raw
 * @param {CellTransform} [transform]
 * @param {ImportMessages} [messages]
 * @returns {{ value: any } | { error: string }}
 */
export function convertCell(field, raw, transform, messages = defaultMessages) {
  const text = transform?.trim === false ? raw : raw.trim();
  if (text === "") {
    return field.required
      ? { error: messages.required(field) }
      : { value: null };
  }
  const mapped = transform?.valueMap?.[text.toLowerCase()];
  const type = field.type || "string";
  /** @type {any} */
  let value = text;
  if (type === "number" || type === "integer") {
    const n = parseNumber(text, field.decimal);
    if (n === undefined) return { error: messages.number(field) };
    if (type === "integer" && !Number.isInteger(n)) {
      return { error: messages.integer(field) };
    }
    value = n;
  } else if (type === "boolean") {
    const key = (mapped ?? text).toLowerCase();
    if (TRUE.has(key)) value = true;
    else if (FALSE.has(key)) value = false;
    else return { error: messages.boolean(field) };
  } else if (type === "date") {
    const formats = transform?.dateFormat
      ? [transform.dateFormat]
      : field.dateFormats;
    const out = parseDate(text, formats);
    if (!out) return { error: messages.date(field) };
    value = out;
  } else if (type === "email") {
    value = text.toLowerCase();
    if (!EMAIL.test(text)) return { error: messages.email(field) };
  } else if (type === "enum") {
    const out = matchOption(field, mapped ?? text);
    if (out === undefined) return { error: messages.enum(field) };
    value = out;
  }

  if (typeof value === "string") {
    if (field.minLength !== undefined && value.length < field.minLength) {
      return { error: messages.minLength(field, field.minLength) };
    }
    if (field.maxLength !== undefined && value.length > field.maxLength) {
      return { error: messages.maxLength(field, field.maxLength) };
    }
  }
  if (typeof value === "number") {
    if (field.min !== undefined && value < field.min) {
      return { error: messages.min(field, field.min) };
    }
    if (field.max !== undefined && value > field.max) {
      return { error: messages.max(field, field.max) };
    }
  }
  if (field.pattern !== undefined) {
    const re =
      typeof field.pattern === "string"
        ? new RegExp(field.pattern)
        : new RegExp(
            field.pattern.source,
            field.pattern.flags.replace("g", ""),
          );
    if (!re.test(String(value))) return { error: messages.pattern(field) };
  }
  return { value };
}

/**
 * The distinct values of a column that don't match any option of an `enum`
 * (or a boolean word), most frequent first. The mapping step offers a value
 * map for them.
 * @param {ImportField} field
 * @param {ReadonlyArray<string>} values
 * @param {number} [limit]
 * @returns {Array<{ value: string, count: number }>}
 */
export function unmatchedValues(field, values, limit = 50) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const raw of values) {
    const text = raw.trim();
    if (text === "") continue;
    const ok =
      field.type === "boolean"
        ? TRUE.has(text.toLowerCase()) || FALSE.has(text.toLowerCase())
        : matchOption(field, text) !== undefined;
    if (!ok) counts.set(text, (counts.get(text) || 0) + 1);
  }
  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

/**
 * The format of a `date` field that reads the most of a column's values.
 * Returns `undefined` for a field with one format or none.
 * @param {ImportField} field
 * @param {ReadonlyArray<string>} values
 * @returns {string | undefined}
 */
export function detectDateFormat(field, values) {
  const formats = field.dateFormats;
  if (!formats || formats.length < 2) return undefined;
  let best = formats[0];
  let bestCount = -1;
  for (const format of formats) {
    let count = 0;
    for (const value of values) {
      if (value.trim() !== "" && parseDate(value, [format])) count++;
    }
    if (count > bestCount) {
      best = format;
      bestCount = count;
    }
  }
  return best;
}
