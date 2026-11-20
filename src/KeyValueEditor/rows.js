// @ts-check

/**
 * @typedef {Object} KeyValueRow
 * @property {string} key
 * @property {string} value
 * @property {boolean} [secret] - Mask the value and offer a reveal button.
 * @property {boolean} [stored] - A secret that is saved on the server but not known here. The row shows a mask and a Replace button, and holds no value.
 * @property {boolean} [enabled] - `false` for a row that is kept but not used. Default `true`.
 * @property {string} [description]
 * @property {string} [scope] - The id of one of the editor's `scopes`; empty means all.
 */

/**
 * @typedef {"key-required" | "key-pattern" | "key-duplicate" | "key-reserved" | "key-too-long" | "value-too-long" | "value-invalid" | "custom"} IssueCode
 * @typedef {Object} FieldIssue
 * @property {IssueCode} code
 * @property {"error" | "warn"} severity
 * @property {string} [message] - The consumer's text, for `"custom"`.
 * @property {number} [limit] - The limit that was passed, for the length codes.
 * @typedef {Object} RowIssues
 * @property {FieldIssue} [key]
 * @property {FieldIssue} [value]
 * @typedef {Object} ValidationResult
 * @property {(RowIssues | undefined)[]} rows - One entry per row; `undefined` for a row with no issue.
 * @property {number} errors - Rows that have an error.
 * @property {number} warnings - Rows that have a warning and no error.
 */

/**
 * @typedef {Object} ValidateOptions
 * @property {RegExp | null} [keyPattern] - Keys must match. `null` for any key.
 * @property {boolean} [caseInsensitiveKeys] - Compare keys for duplicates without case. Default `false`.
 * @property {"error" | "warn" | "allow"} [duplicateKeys] - Default `"error"`.
 * @property {boolean} [scoped] - Rows with different scopes may share a key. Default `false`.
 * @property {number} [maxKeyLength]
 * @property {number} [maxValueLength]
 * @property {ReadonlyArray<string> | ((key: string) => boolean)} [reservedKeys]
 * @property {RegExp} [valuePattern] - A value that matches is rejected with `"value-invalid"`.
 * @property {(row: KeyValueRow, index: number, rows: ReadonlyArray<KeyValueRow>) => { key?: string; value?: string } | undefined | void} [validate] - Runs last; each string is an error message.
 */

/** Letters, digits and underscore; not a digit first. */
export const ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
/** An HTTP field name: RFC 9110 `token`. */
export const HEADER_NAME_PATTERN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
/** No `=`, no line break, no space at either end. */
export const PLAIN_KEY_PATTERN = /^[^\s=](?:[^=\n\r]*[^\s=])?$/;
// biome-ignore lint/suspicious/noControlCharactersInRegex: matches control characters on purpose
const HEADER_VALUE_FORBIDDEN = /[\0\r\n]/;
// biome-ignore lint/suspicious/noControlCharactersInRegex: matches NUL on purpose
const NUL = /\0/;
const FORM_FIELD = /^\[(\d{1,6})\]\[(\w+)\]$/;

/**
 * The defaults of a `format`. `env` follows POSIX names, `headers` follow
 * HTTP field names and never repeat case-sensitively, `plain` takes any key
 * that can be written as `key=value`.
 *
 * @param {"env" | "headers" | "plain"} format
 * @returns {ValidateOptions}
 */
export function formatDefaults(format) {
  if (format === "env") {
    return {
      keyPattern: ENV_KEY_PATTERN,
      valuePattern: NUL,
      caseInsensitiveKeys: false,
    };
  }
  if (format === "headers") {
    return {
      keyPattern: HEADER_NAME_PATTERN,
      valuePattern: HEADER_VALUE_FORBIDDEN,
      caseInsensitiveKeys: true,
    };
  }
  return {
    keyPattern: PLAIN_KEY_PATTERN,
    valuePattern: HEADER_VALUE_FORBIDDEN,
    caseInsensitiveKeys: false,
  };
}

/**
 * Check every row. Duplicates are found with one pass over a map, so the
 * cost grows with the row count, not its square.
 *
 * @param {ReadonlyArray<KeyValueRow>} rows
 * @param {ValidateOptions} [options]
 * @returns {ValidationResult}
 */
export function validateRows(rows, options = {}) {
  const {
    keyPattern = null,
    caseInsensitiveKeys = false,
    duplicateKeys = "error",
    scoped = false,
    maxKeyLength,
    maxValueLength,
    reservedKeys,
    valuePattern,
    validate,
  } = options;
  /** @type {(RowIssues | undefined)[]} */
  const issues = new Array(rows.length);
  const reserved = Array.isArray(reservedKeys)
    ? new Set(
        reservedKeys.map((key) =>
          caseInsensitiveKeys ? key.toLowerCase() : key,
        ),
      )
    : undefined;

  /** @type {Map<string, number[]>} */
  const byKey = new Map();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const key = row.key ?? "";
    const value = row.value ?? "";
    /** @type {RowIssues} */
    const found = {};

    if (key === "") {
      if (value !== "" || row.description) {
        found.key = { code: "key-required", severity: "error" };
      }
    } else {
      if (keyPattern && !keyPattern.test(key)) {
        found.key = { code: "key-pattern", severity: "error" };
      } else if (maxKeyLength !== undefined && key.length > maxKeyLength) {
        found.key = {
          code: "key-too-long",
          severity: "error",
          limit: maxKeyLength,
        };
      } else if (
        reservedKeys &&
        (reserved
          ? reserved.has(caseInsensitiveKeys ? key.toLowerCase() : key)
          : /** @type {(key: string) => boolean} */ (reservedKeys)(key))
      ) {
        found.key = { code: "key-reserved", severity: "error" };
      }
      if (duplicateKeys !== "allow") {
        const id = caseInsensitiveKeys ? key.toLowerCase() : key;
        const group = byKey.get(id);
        if (group) group.push(i);
        else byKey.set(id, [i]);
      }
    }

    if (!row.stored) {
      if (maxValueLength !== undefined && value.length > maxValueLength) {
        found.value = {
          code: "value-too-long",
          severity: "error",
          limit: maxValueLength,
        };
      } else if (valuePattern && valuePattern.test(value)) {
        found.value = { code: "value-invalid", severity: "error" };
      }
    }

    if (validate) {
      const custom = validate(row, i, rows);
      if (custom?.key && !found.key) {
        found.key = { code: "custom", severity: "error", message: custom.key };
      }
      if (custom?.value && !found.value) {
        found.value = {
          code: "custom",
          severity: "error",
          message: custom.value,
        };
      }
    }
    if (found.key || found.value) issues[i] = found;
  }

  for (const group of byKey.values()) {
    if (group.length < 2) continue;
    // With scopes, an empty scope means every scope, so it clashes with any
    // other row; otherwise only rows in the same scope clash.
    let clashing = group;
    if (scoped && !group.some((i) => !rows[i].scope)) {
      clashing = [];
      /** @type {Map<string, number[]>} */
      const byScope = new Map();
      for (const i of group) {
        const scope = /** @type {string} */ (rows[i].scope);
        const list = byScope.get(scope);
        if (list) list.push(i);
        else byScope.set(scope, [i]);
      }
      for (const list of byScope.values()) {
        if (list.length > 1) clashing.push(...list);
      }
    }
    for (const i of clashing) {
      const entry = issues[i] ?? (issues[i] = {});
      if (!entry.key) {
        entry.key = {
          code: "key-duplicate",
          severity: duplicateKeys === "warn" ? "warn" : "error",
        };
      }
    }
  }

  let errors = 0;
  let warnings = 0;
  for (const entry of issues) {
    if (!entry) continue;
    const list = [entry.key, entry.value];
    if (list.some((issue) => issue?.severity === "error")) errors++;
    else warnings++;
  }
  return { rows: issues, errors, warnings };
}

/**
 * Turn rows into a plain object, as a server or an HTTP client wants them.
 * Blank, `stored` and disabled rows are skipped; the last of a repeated key
 * wins. A key such as `__proto__` becomes an own property and never reaches
 * the prototype.
 *
 * @param {ReadonlyArray<KeyValueRow>} rows
 * @returns {Record<string, string>}
 */
export function toRecord(rows) {
  /** @type {Record<string, string>} */
  const record = {};
  for (const row of rows) {
    if (!row.key || row.stored || row.enabled === false) continue;
    Object.defineProperty(record, row.key, {
      value: row.value ?? "",
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  return record;
}

/**
 * Turn a plain object into rows, in key order. A value that is not a string is
 * written with `String`.
 *
 * @param {Readonly<Record<string, unknown>>} record
 * @returns {KeyValueRow[]}
 */
export function fromRecord(record) {
  return Object.entries(record).map(([key, value]) => ({
    key,
    value: value === null || value === undefined ? "" : String(value),
  }));
}

/**
 * Move one row. A move outside the list is clamped; a move to the same place
 * returns the same array.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {number} from
 * @param {number} to
 * @returns {ReadonlyArray<T>}
 */
export function moveRow(rows, from, to) {
  const target = Math.max(0, Math.min(rows.length - 1, to));
  if (from < 0 || from >= rows.length || from === target) return rows;
  const next = rows.slice();
  const [row] = next.splice(from, 1);
  next.splice(target, 0, row);
  return next;
}

/** @param {KeyValueRow} row */
function isBlank(row) {
  return !row.key && !row.value && !row.description && !row.stored;
}

/**
 * Put parsed entries into a list of rows.
 *
 * An entry whose key is already there updates that row's value (and un-stores
 * it); a new key goes after the last row. The row at `replace` is replaced
 * instead when it is blank, so pasting into an empty row does not leave it
 * behind. Stops at `limit` rows.
 *
 * @param {ReadonlyArray<KeyValueRow>} rows
 * @param {ReadonlyArray<{ key: string; value: string; enabled?: boolean }>} entries
 * @param {{ replace?: number; caseInsensitive?: boolean; limit?: number; defaults?: Partial<KeyValueRow> }} [options]
 * @returns {{ rows: KeyValueRow[]; added: number; updated: number; skipped: number; firstIndex: number }}
 */
export function mergeEntries(rows, entries, options = {}) {
  const { replace, caseInsensitive = false, limit, defaults = {} } = options;
  const norm = (/** @type {string} */ key) =>
    caseInsensitive ? key.toLowerCase() : key;
  const next = rows.slice();
  /** @type {Map<string, number>} */
  const index = new Map();
  next.forEach((row, i) => {
    if (row.key && !index.has(norm(row.key))) index.set(norm(row.key), i);
  });
  let blank =
    replace !== undefined && next[replace] && isBlank(next[replace])
      ? replace
      : undefined;
  let added = 0;
  let updated = 0;
  let skipped = 0;
  let firstIndex = -1;

  for (const entry of entries) {
    const at = index.get(norm(entry.key));
    if (at !== undefined) {
      const { stored: _stored, ...rest } = next[at];
      next[at] = {
        ...rest,
        value: entry.value,
        ...(entry.enabled === false ? { enabled: false } : {}),
      };
      updated++;
      if (firstIndex === -1) firstIndex = at;
      continue;
    }
    /** @type {KeyValueRow} */
    const row = {
      ...defaults,
      key: entry.key,
      value: entry.value,
      ...(entry.enabled === false ? { enabled: false } : {}),
    };
    if (blank !== undefined) {
      next[blank] = { ...next[blank], ...row };
      index.set(norm(entry.key), blank);
      if (firstIndex === -1) firstIndex = blank;
      blank = undefined;
      added++;
      continue;
    }
    if (limit !== undefined && next.length >= limit) {
      skipped++;
      continue;
    }
    next.push(row);
    index.set(norm(entry.key), next.length - 1);
    if (firstIndex === -1) firstIndex = next.length - 1;
    added++;
  }
  return { rows: next, added, updated, skipped, firstIndex };
}

/**
 * Rebuild rows from edited text. Each entry takes the first unused row with
 * the same key as its base, so a row keeps its secret flag, description and
 * scope when its line is edited or moved.
 *
 * @param {ReadonlyArray<{ key: string; value: string; enabled?: boolean }>} entries
 * @param {ReadonlyArray<KeyValueRow>} base
 * @param {{ caseInsensitive?: boolean }} [options]
 * @returns {KeyValueRow[]}
 */
export function rowsFromEntries(entries, base, options = {}) {
  const norm = (/** @type {string} */ key) =>
    options.caseInsensitive ? key.toLowerCase() : key;
  /** @type {Map<string, KeyValueRow[]>} */
  const pool = new Map();
  for (const row of base) {
    if (row.stored) continue;
    const id = norm(row.key);
    const list = pool.get(id);
    if (list) list.push(row);
    else pool.set(id, [row]);
  }
  return entries.map((entry) => {
    const original = pool.get(norm(entry.key))?.shift();
    /** @type {KeyValueRow} */
    const row = { ...original, key: entry.key, value: entry.value };
    if (entry.enabled === false) row.enabled = false;
    else if (original?.enabled === false) row.enabled = true;
    return row;
  });
}

/**
 * Read the rows a native form post made. The inverse of the editor's field
 * names: `env[0][key]`, `env[0][value]`, `env[0][secret]`, and so on.
 * Missing indexes are skipped; the rows come back in index order.
 *
 * @param {FormData | URLSearchParams} data
 * @param {string} name - The editor's `name`.
 * @returns {KeyValueRow[]}
 */
export function rowsFromFormData(data, name) {
  /** @type {Map<number, Record<string, string>>} */
  const found = new Map();
  const prefix = `${name}[`;
  for (const [field, value] of data.entries()) {
    if (typeof value !== "string" || !field.startsWith(prefix)) continue;
    const match = FORM_FIELD.exec(field.slice(name.length));
    if (!match) continue;
    const at = Number(match[1]);
    const entry = found.get(at) ?? {};
    entry[match[2]] = value;
    found.set(at, entry);
  }
  return [...found.keys()]
    .sort((a, b) => a - b)
    .map((at) => {
      const entry = /** @type {Record<string, string>} */ (found.get(at));
      /** @type {KeyValueRow} */
      const row = { key: entry.key ?? "", value: entry.value ?? "" };
      if (entry.secret === "1") row.secret = true;
      if (entry.stored === "1") row.stored = true;
      if (entry.enabled === "0") row.enabled = false;
      if (entry.description !== undefined) row.description = entry.description;
      if (entry.scope !== undefined) row.scope = entry.scope;
      return row;
    });
}
