// @ts-check
import { convertCell, defaultMessages } from "./schema.js";

/** The key under which a problem with a whole row (not one cell) is stored. */
export const ROW_ERROR = "$row";

/**
 * @typedef {import("./schema.js").ImportField} ImportField
 * @typedef {import("./schema.js").CellTransform} CellTransform
 * @typedef {import("./schema.js").ImportMessages} ImportMessages
 *
 * @typedef {object} SessionConfig
 * @property {ReadonlyArray<ImportField>} fields
 * @property {ReadonlyArray<string>} headers
 * @property {string[][]} rows - Rectangular rows (see `toTable`). The session edits them in place.
 * @property {ReadonlyArray<string | null>} mapping - The field key for each source column.
 * @property {Record<string, CellTransform>} [transforms]
 * @property {string} [keyField] - Rows sharing this field's value are duplicates.
 * @property {"skip" | "error" | "keep"} [duplicates] - Defaults to `"skip"`.
 * @property {Partial<ImportMessages>} [messages]
 * @property {Map<number, number>} [long] - Rows that had more cells than the header (see `toTable`).
 * @property {number} [firstRowNumber] - The row number shown for `rows[0]`. Defaults to 2 (one header row).
 * @property {(record: Record<string, any>, index: number) => string | Record<string, string> | null | undefined | void} [validateRow]
 *
 * @typedef {object} ImportSummary
 * @property {number} total - Rows read, minus the removed ones.
 * @property {number} valid
 * @property {number} errors - Rows with at least one problem.
 * @property {number} duplicates - Rows repeating an earlier key, without other problems.
 * @property {number} removed
 *
 * @typedef {object} ImportContext
 * @property {AbortSignal} signal
 * @property {number} chunk - Zero-based index of this chunk.
 * @property {number} chunks
 * @property {number} offset - Rows imported before this chunk.
 *
 * @typedef {object} ImportProgress
 * @property {number} done - Rows handed to `onImport` so far.
 * @property {number} total
 * @property {number} failed
 *
 * @typedef {object} ImportFailure
 * @property {number} index - The row's index in the file's data rows.
 * @property {number} row - The row number in the file.
 * @property {string} message
 *
 * @typedef {object} ImportResult
 * @property {number} imported
 * @property {ImportFailure[]} failed
 * @property {number} remaining - Rows not attempted because the import was canceled or stopped.
 * @property {boolean} canceled
 * @property {number} total
 */

/**
 * The state of one import: the rows, the mapping, each row's problems, and
 * the work on them. It has no DOM and no reactivity, so a store, a component
 * or a test can drive it.
 * @param {SessionConfig} config
 */
export function createImportSession(config) {
  const { fields, headers, rows } = config;
  const messages = { ...defaultMessages, ...config.messages };
  const transforms = config.transforms || {};
  const policy = config.duplicates || "skip";
  const firstRowNumber = config.firstRowNumber ?? 2;
  const long = config.long || new Map();

  /** @type {Map<string, number>} */
  const columnOf = new Map();
  config.mapping.forEach((key, column) => {
    if (key && !columnOf.has(key)) columnOf.set(key, column);
  });
  const active = fields.filter((f) => columnOf.has(f.key));
  const keyColumn = config.keyField ? columnOf.get(config.keyField) : undefined;

  /** @type {Map<number, Record<string, string>>} */
  const errors = new Map();
  /** @type {Map<number, number>} */
  const dupes = new Map();
  /** @type {Set<number>} */
  const removed = new Set();
  let version = 0;
  /** @type {{ version: number, summary: ImportSummary, errorIds: number[], dupeIds: number[] } | null} */
  let cache = null;

  /** @param {number} id */
  function check(id) {
    const row = rows[id];
    /** @type {Record<string, string>} */
    const found = {};
    /** @type {Record<string, any>} */
    const record = {};
    for (const field of active) {
      const column = /** @type {number} */ (columnOf.get(field.key));
      const result = convertCell(
        field,
        row[column],
        transforms[field.key],
        messages,
      );
      if ("error" in result) found[field.key] = result.error;
      else record[field.key] = result.value;
    }
    for (const field of active) {
      if (!field.validate || field.key in found) continue;
      const message = field.validate(record[field.key], record);
      if (message) found[field.key] = message;
    }
    const cells = long.get(id);
    if (cells !== undefined) {
      found[ROW_ERROR] = messages.extraValues(cells, headers.length);
    }
    if (config.validateRow && Object.keys(found).length === 0) {
      const extra = config.validateRow(record, id);
      if (typeof extra === "string") found[ROW_ERROR] = extra;
      else if (extra) Object.assign(found, extra);
    }
    if (Object.keys(found).length) errors.set(id, found);
    else errors.delete(id);
  }

  function findDuplicates() {
    dupes.clear();
    if (keyColumn === undefined) return;
    /** @type {Map<string, number>} */
    const first = new Map();
    for (let id = 0; id < rows.length; id++) {
      if (removed.has(id)) continue;
      const key = rows[id][keyColumn].trim().toLowerCase();
      if (key === "") continue;
      const seen = first.get(key);
      if (seen === undefined) first.set(key, id);
      else dupes.set(id, seen);
    }
  }

  /** @param {number} id */
  function failing(id) {
    return errors.has(id) || (policy === "error" && dupes.has(id));
  }

  function measure() {
    if (cache && cache.version === version) return cache;
    const errorIds = [];
    const dupeIds = [];
    for (let id = 0; id < rows.length; id++) {
      if (removed.has(id)) continue;
      if (failing(id)) errorIds.push(id);
      else if (dupes.has(id) && policy === "skip") dupeIds.push(id);
    }
    const total = rows.length - removed.size;
    cache = {
      version,
      errorIds,
      dupeIds,
      summary: {
        total,
        errors: errorIds.length,
        duplicates: dupeIds.length,
        valid: total - errorIds.length - dupeIds.length,
        removed: removed.size,
      },
    };
    return cache;
  }

  /** @param {number} id */
  function messagesFor(id) {
    const found = { ...errors.get(id) };
    const first = dupes.get(id);
    if (first !== undefined && policy !== "keep" && config.keyField) {
      found[config.keyField] ??= messages.duplicate(first + firstRowNumber);
    }
    return found;
  }

  /**
   * Check every row, yielding to the page between slices so a long run
   * doesn't freeze it.
   * @param {{ signal?: AbortSignal, onProgress?: (done: number, total: number) => void, sliceMs?: number }} [options]
   */
  async function validate(options = {}) {
    const { signal, onProgress, sliceMs = 12 } = options;
    errors.clear();
    let sliceStart = performance.now();
    for (let id = 0; id < rows.length; id++) {
      if (removed.has(id)) continue;
      check(id);
      if ((id & 255) === 255 && performance.now() - sliceStart > sliceMs) {
        onProgress?.(id + 1, rows.length);
        // biome-ignore lint/performance/noAwaitInLoops: yielding between slices is the point
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
        sliceStart = performance.now();
      }
    }
    findDuplicates();
    version++;
    onProgress?.(rows.length, rows.length);
  }

  /** @param {number} id */
  function revalidate(id) {
    check(id);
    version++;
  }

  /**
   * Edit a cell and check its row again.
   * @param {number} id
   * @param {string} fieldKey
   * @param {string} text
   */
  function setCell(id, fieldKey, text) {
    const column = columnOf.get(fieldKey);
    if (column === undefined || removed.has(id)) return;
    rows[id][column] = text;
    check(id);
    if (column === keyColumn) findDuplicates();
    version++;
  }

  /** @param {Iterable<number>} ids */
  function removeRows(ids) {
    for (const id of ids) {
      removed.add(id);
      errors.delete(id);
    }
    if (keyColumn !== undefined) findDuplicates();
    version++;
  }

  function removeErrorRows() {
    removeRows(measure().errorIds.slice());
  }

  /**
   * Replace text in the rows that have a problem in this field (or in every
   * row, with `onlyErrors: false`). Without `whole`, only the matching part
   * of the cell changes. Returns the number of cells changed.
   * @param {string} fieldKey
   * @param {{ find: string, replace: string, matchCase?: boolean, whole?: boolean, onlyErrors?: boolean }} change
   */
  function replaceInColumn(fieldKey, change) {
    const column = columnOf.get(fieldKey);
    if (column === undefined || change.find === "") return 0;
    const { find, replace, matchCase, whole, onlyErrors = true } = change;
    const needle = matchCase ? find : find.toLowerCase();
    const pattern = new RegExp(
      find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      matchCase ? "g" : "gi",
    );
    let changed = 0;
    for (let id = 0; id < rows.length; id++) {
      if (removed.has(id)) continue;
      if (onlyErrors && errors.get(id)?.[fieldKey] === undefined) continue;
      const cell = rows[id][column];
      /** @type {string | undefined} */
      let next;
      if (whole) {
        const hay = matchCase ? cell.trim() : cell.trim().toLowerCase();
        if (hay === needle) next = replace;
      } else {
        next = cell.replace(pattern, () => replace);
      }
      if (next !== undefined && next !== cell) {
        rows[id][column] = next;
        check(id);
        changed++;
      }
    }
    if (changed) {
      if (column === keyColumn) findDuplicates();
      version++;
    }
    return changed;
  }

  /** @param {number} id */
  function toRecord(id) {
    /** @type {Record<string, any>} */
    const record = {};
    for (const field of active) {
      const result = convertCell(
        field,
        rows[id][/** @type {number} */ (columnOf.get(field.key))],
        transforms[field.key],
        messages,
      );
      record[field.key] = "value" in result ? result.value : null;
    }
    return record;
  }

  /**
   * Hand the valid rows to `onImport` in chunks. A chunk that throws fails
   * its rows and the import goes on (unless `stopOnError`); `onImport` can
   * also return `{ errors: [{ index, message }] }` to fail single rows. An
   * abort stops after the chunk in flight.
   * @param {(records: Array<Record<string, any>>, context: ImportContext) => void | undefined | { errors?: ReadonlyArray<{ index: number, message: string }> } | Promise<void | undefined | { errors?: ReadonlyArray<{ index: number, message: string }> }>} onImport
   * @param {{ chunkSize?: number, signal?: AbortSignal, stopOnError?: boolean, onProgress?: (progress: ImportProgress) => void }} [options]
   * @returns {Promise<ImportResult>}
   */
  async function run(onImport, options = {}) {
    const { chunkSize = 500, stopOnError = false, onProgress } = options;
    const signal = options.signal || new AbortController().signal;
    const bad = new Set(measure().errorIds);
    const skip = new Set(measure().dupeIds);
    const ids = [];
    for (let id = 0; id < rows.length; id++) {
      if (!removed.has(id) && !bad.has(id) && !skip.has(id)) ids.push(id);
    }
    /** @type {ImportFailure[]} */
    const failed = [];
    const chunks = Math.ceil(ids.length / chunkSize);
    let imported = 0;
    let done = 0;
    let canceled = false;
    for (let chunk = 0; chunk < chunks; chunk++) {
      if (signal.aborted) {
        canceled = true;
        break;
      }
      const batch = ids.slice(chunk * chunkSize, (chunk + 1) * chunkSize);
      /** @param {number} id @param {string} message */
      const fail = (id, message) =>
        failed.push({ index: id, row: id + firstRowNumber, message });
      try {
        // biome-ignore lint/performance/noAwaitInLoops: chunks go one after another
        const reply = await onImport(batch.map(toRecord), {
          signal,
          chunk,
          chunks,
          offset: imported,
        });
        const bounced = new Set();
        for (const e of reply?.errors || []) {
          if (batch[e.index] === undefined || bounced.has(e.index)) continue;
          bounced.add(e.index);
          fail(batch[e.index], e.message);
        }
        imported += batch.length - bounced.size;
      } catch (error) {
        if (signal.aborted) {
          canceled = true;
          break;
        }
        const message = error instanceof Error ? error.message : String(error);
        for (const id of batch) fail(id, message);
        done += batch.length;
        onProgress?.({ done, total: ids.length, failed: failed.length });
        if (stopOnError) break;
        continue;
      }
      done += batch.length;
      onProgress?.({ done, total: ids.length, failed: failed.length });
    }
    return {
      imported,
      failed,
      remaining: ids.length - done,
      canceled,
      total: ids.length,
    };
  }

  /**
   * The rows that weren't imported, with the reason, ready for a CSV.
   * @param {ImportResult} [result] - Adds the rows that failed in `onImport`.
   * @returns {{ headers: string[], rows: string[][] }}
   */
  function report(result) {
    const failures = new Map(
      (result?.failed || []).map((f) => [f.index, f.message]),
    );
    const out = [];
    for (let id = 0; id < rows.length; id++) {
      if (removed.has(id)) continue;
      let problem = "";
      if (failures.has(id)) problem = /** @type {string} */ (failures.get(id));
      else if (failing(id) || dupes.has(id)) {
        problem = Object.entries(messagesFor(id))
          .map(([key, message]) =>
            key === ROW_ERROR
              ? message
              : `${fields.find((f) => f.key === key)?.label || key}: ${message}`,
          )
          .join("; ");
      }
      if (problem && (failures.has(id) || failing(id) || policy === "skip")) {
        out.push([String(id + firstRowNumber), problem, ...rows[id]]);
      }
    }
    return { headers: ["Row", "Problem", ...headers], rows: out };
  }

  return {
    fields: active,
    rows,
    columnOf,
    firstRowNumber,
    keyField: config.keyField,
    validate,
    revalidate,
    setCell,
    removeRows,
    removeErrorRows,
    replaceInColumn,
    run,
    report,
    toRecord,
    summary: () => measure().summary,
    errorIds: () => measure().errorIds,
    duplicateIds: () => measure().dupeIds,
    isRemoved: (/** @type {number} */ id) => removed.has(id),
    /** @param {number} id */
    problems: (id) => messagesFor(id),
  };
}
