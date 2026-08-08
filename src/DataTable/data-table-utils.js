// @ts-check
/**
 * Deep equality check for values (nested objects and arrays).
 * @param {*} a - First value to compare
 * @param {*} b - Second value to compare
 * @param {WeakMap<*, Set<*>>} [stack] - WeakMap used to track circular references
 * @returns {boolean} True if values are deeply equal, false otherwise
 */
function deepEqual(a, b, stack = new WeakMap()) {
  // Fast path: reference equality.
  if (a === b) return true;

  // Handle null/undefined.
  if (a == null || b == null) return a === b;

  // Handle NaN: NaN is the only value where NaN !== NaN is true in JavaScript
  // Without this check, two NaN values would incorrectly be considered unequal.
  if (Number.isNaN(a) && Number.isNaN(b)) return true;
  if (Number.isNaN(a) || Number.isNaN(b)) return false;

  if (typeof a !== typeof b) return false;

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags;
  }

  if (typeof a === "function" && typeof b === "function") {
    return a === b;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      // Pass the stack to handle nested arrays and prevent infinite recursion.
      if (!deepEqual(a[i], b[i], stack)) return false;
    }
    return true;
  }

  if (typeof a === "object" && typeof b === "object") {
    const aVisited = stack.get(a);

    if (aVisited?.has(b)) {
      // Circular reference: if we've already seen this (a, b) pair, they're equal.
      return true;
    }

    // WeakMap entries are auto-removed when keys are garbage collected.
    if (aVisited) {
      aVisited.add(b);
    } else {
      stack.set(a, new Set([b]));
    }

    // Compare string keys: objects must have the same enumerable properties.
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
      stack.get(a)?.delete(b);
      return false;
    }

    for (const key of keysA) {
      // Pass the stack to handle nested objects and prevent infinite recursion.
      if (!(key in b) || !deepEqual(a[key], b[key], stack)) {
        stack.get(a)?.delete(b);
        return false;
      }
    }

    const symKeysA = Object.getOwnPropertySymbols(a);
    const symKeysB = Object.getOwnPropertySymbols(b);
    if (symKeysA.length !== symKeysB.length) {
      stack.get(a)?.delete(b);
      return false;
    }

    // Recursively compare Symbol property values.
    for (const key of symKeysA) {
      if (!symKeysB.includes(key) || !deepEqual(a[key], b[key], stack)) {
        stack.get(a)?.delete(b);
        return false;
      }
    }

    // All checks passed: remove (a, b) from tracking before returning
    // Cleanup is for correctness (not GC): allows same objects to be
    // compared again without false circular reference detection.
    stack.get(a)?.delete(b);
    return true;
  }

  // Finally, use strict equality for primitives.
  return a === b;
}

/**
 * Lightweight deep equality check optimized for DataTable rows.
 * Compares arrays of row objects by first checking IDs (fast path),
 * then falling back to deep object comparison to handle nested structures.
 * @template T
 * @param {ReadonlyArray<T> | null} a - First array of rows to compare
 * @param {ReadonlyArray<T> | null} b - Second array of rows to compare
 * @returns {boolean} True if row arrays are deeply equal, false otherwise
 */
export function rowsEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;

  if (a.length !== b.length) return false;

  // Fast path: compare by row IDs first, assuming rows have stable IDs.
  for (let i = 0; i < a.length; i++) {
    if (a[i]?.id !== b[i]?.id) return false;
  }

  // If IDs match, do deep comparison of row objects
  // This catches cases where row data changed but ID stayed the same,
  // including changes in nested objects (e.g., "contact.company")
  for (let i = 0; i < a.length; i++) {
    const rowA = a[i];
    const rowB = b[i];

    // Fast path: same reference
    if (rowA === rowB) continue;

    // Deep comparison to handle nested objects and arrays
    if (!deepEqual(rowA, rowB)) return false;
  }

  return true;
}

const RE_IGNORE_ROW_CLICK = /^bx--(overflow-menu|checkbox|radio-button)/;

/**
 * Returns true if the element's class list indicates the click target
 * is an overflow menu, checkbox, or radio button (row click should be ignored).
 * @param {EventTarget | null} target - The event target (e.g., from a click event)
 * @returns {boolean}
 */
export function shouldIgnoreRowClick(target) {
  if (!target || !("classList" in target)) return false;
  const el = /** @type {HTMLElement} */ (target);
  return [...el.classList].some((name) => RE_IGNORE_ROW_CLICK.test(name));
}

const PATH_SPLIT_REGEX = /[.[\]'"]/;
const MAX_PATH_CACHE_SIZE = 1000;
/** @type {Map<string, string[]>} */
const pathCache = new Map();

/**
 * Resolves a nested property path in an object.
 * Supports both direct property access and nested paths like "contact.company".
 * @template {Record<string, unknown>} T
 * @param {T} object - The object to resolve the path from
 * @param {string} path - The property path (e.g., "name" or "contact.company")
 * @returns {unknown} The resolved value, or undefined if the path doesn't exist
 */
export function resolvePath(object, path) {
  if (path in object) return object[path];

  let segments = pathCache.get(path);
  if (!segments) {
    segments = path.split(PATH_SPLIT_REGEX).filter((p) => p);
    if (segments.length > 1) {
      if (pathCache.size >= MAX_PATH_CACHE_SIZE) {
        const firstKey = pathCache.keys().next().value;
        if (firstKey !== undefined) {
          pathCache.delete(firstKey);
        }
      }
      pathCache.set(path, segments);
    }
  }

  return (segments ?? []).reduce(
    /**
     * @param {unknown} acc
     * @param {string} p
     * @returns {unknown}
     */
    (acc, p) =>
      acc && typeof acc === "object"
        ? /** @type {Record<string, unknown>} */ (acc)[p]
        : acc,
    object,
  );
}

/**
 * Paginates an array of rows based on page number and page size.
 * @template {Record<string, unknown>} Row
 * @param {ReadonlyArray<Row>} rows - The rows to paginate
 * @param {number} page - The current page number (1-indexed)
 * @param {number} pageSize - The number of items per page
 * @returns {ReadonlyArray<Row>} The paginated rows, or all rows if pagination is disabled
 */
export function getDisplayedRows(rows, page, pageSize) {
  if (page && pageSize) {
    return rows.slice((page - 1) * pageSize, page * pageSize);
  }
  return rows;
}

/**
 * Formats header width styles for table headers.
 * Combines width and minWidth into a CSS style string.
 * @template {object} Header
 * @param {Header & { width?: string | null | number; minWidth?: string | null | number; [key: string]: unknown }} header - The header object
 * @returns {string | undefined} The formatted style string, or undefined if no width styles
 */
export function formatHeaderWidth(header) {
  const styles = [
    header.width && `width: ${header.width}`,
    header.minWidth && `min-width: ${header.minWidth}`,
  ].filter(Boolean);
  if (styles.length === 0) return undefined;
  return styles.join(";");
}

/**
 * Returns true when a column filter value should narrow the rows.
 * `undefined`, `null`, a blank string, and an empty array leave the column unfiltered.
 * @param {unknown} filterValue - A value from the `filters` map
 * @returns {boolean}
 */
export function isColumnFilterActive(filterValue) {
  if (filterValue == null) return false;
  if (Array.isArray(filterValue)) return filterValue.length > 0;
  if (typeof filterValue === "string") return filterValue.trim().length > 0;
  return true;
}

/**
 * Builds the predicate for one active column filter. Called once per filter pass so
 * per-value work (lowercasing a needle, building a membership set) stays out of the
 * row loop.
 *
 * `headerFilter` wins when the column defines one. Otherwise an array `filterValue`
 * matches cell values that are members of it, a string matches a case-insensitive
 * substring of a string or number cell value (what the toolbar search does), and any
 * other value matches by strict equality.
 * @template {Record<string, unknown>} Row
 * @param {unknown} filterValue - A value from the `filters` map
 * @param {(value: any, filterValue: any, row: Row) => boolean} [headerFilter] - Per-column predicate override
 * @returns {(cellValue: unknown, row: Row) => boolean}
 */
export function createColumnFilterPredicate(filterValue, headerFilter) {
  if (typeof headerFilter === "function") {
    return (cellValue, row) => !!headerFilter(cellValue, filterValue, row);
  }

  if (Array.isArray(filterValue)) {
    const allowed = new Set(filterValue);
    return (cellValue) => allowed.has(cellValue);
  }

  if (typeof filterValue === "string") {
    const value = filterValue.trim().toLowerCase();
    return (cellValue) => {
      if (typeof cellValue !== "string" && typeof cellValue !== "number") {
        return false;
      }
      return `${cellValue}`.toLowerCase().includes(value);
    };
  }

  return (cellValue) => cellValue === filterValue;
}

/**
 * Compares two values for sorting in a data table.
 * Handles numbers, strings, null/undefined values, and custom sort functions.
 * @template T
 * @param {T} itemA - First value to compare
 * @param {T} itemB - Second value to compare
 * @param {boolean} ascending - Whether to sort in ascending order
 * @param {((a: T, b: T) => number) | false | undefined} customSort - Optional custom sort function
 * @returns {number} Negative if a < b (ascending) or a > b (descending), positive if a > b (ascending) or a < b (descending), 0 if equal
 */
export function compareValues(itemA, itemB, ascending, customSort) {
  if (customSort) {
    const result = customSort(itemA, itemB);
    return ascending ? result : -result;
  }

  let result;

  // Fast path: numeric comparison
  if (typeof itemA === "number" && typeof itemB === "number") {
    result = itemA - itemB;
  } else {
    // Handle null/undefined values
    if ([itemA, itemB].every((item) => !item && item !== 0)) {
      result = 0;
    } else if (!itemA && itemA !== 0) {
      result = 1;
    } else if (!itemB && itemB !== 0) {
      result = -1;
    } else {
      result = String(itemA).localeCompare(
        String(itemB),
        // Use undefined to default to user's locale
        undefined,
        {
          // Enable numeric sorting for strings that look like numbers
          // E.g., "10" should come after "2"
          numeric: true,
          // Comparison is case- and accent-insensitive
          // E.g., "apple" == "Apple", "café" == "cafe"
          sensitivity: "base",
        },
      );
    }
  }

  // Reverse result for descending order
  return ascending ? result : -result;
}

// Leading characters a spreadsheet interprets as the start of a formula.
const FORMULA_PREFIX_REGEX = /^[=+\-@\t\r]/;

/**
 * Stringifies a cell value for CSV output.
 * @param {unknown} value - The resolved cell value
 * @returns {string} The value as a string; empty for null and undefined
 */
function stringifyCsvValue(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Quotes and escapes a single CSV field per RFC 4180.
 * @param {string} field - The stringified field value
 * @param {string} delimiter - The field delimiter
 * @param {boolean} escapeFormulas - Whether to neutralize spreadsheet formulas
 * @returns {string} The escaped field
 */
function escapeCsvField(field, delimiter, escapeFormulas) {
  const value =
    escapeFormulas && FORMULA_PREFIX_REGEX.test(field) ? `'${field}` : field;

  if (
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes("\r") ||
    value.includes("\n")
  ) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

/**
 * @typedef {object} ToCsvHeader
 * @property {string} key - Column key; supports nested paths like "contact.company"
 * @property {unknown} [value] - Column label; falls back to the key
 * @property {boolean} [empty] - Whether the column renders no data
 * @property {(item: unknown, row: Record<string, unknown>) => unknown} [display] - Formats the cell value
 */

/**
 * @typedef {object} ToCsvOptions
 * @property {string} [delimiter] - Field delimiter. Defaults to ","
 * @property {boolean} [includeHeaders] - Whether to emit the header row. Defaults to true
 * @property {boolean} [escapeFormulas] - Whether to prefix fields starting with "=", "+", "-", "@", tab, or carriage return with a single quote. Defaults to true
 * @property {string} [newline] - Line ending. Defaults to "\r\n"
 */

/**
 * Serializes data table headers and rows to a CSV string.
 * Skips empty columns, resolves nested keys, and applies `display` formatting
 * so the export matches the rendered table.
 * @template {Record<string, unknown>} Row
 * @param {ReadonlyArray<ToCsvHeader>} headers - The data table headers
 * @param {ReadonlyArray<Row>} rows - The rows to serialize
 * @param {ToCsvOptions} [options] - Serialization options
 * @returns {string} The CSV string
 */
export function toCsv(headers, rows, options = {}) {
  const {
    delimiter = ",",
    includeHeaders = true,
    escapeFormulas = true,
    newline = "\r\n",
  } = options;

  const columns = headers.filter((header) => !header.empty);
  /** @type {string[]} */
  const lines = [];

  if (includeHeaders) {
    lines.push(
      columns
        .map((header) =>
          escapeCsvField(
            stringifyCsvValue(header.value ?? header.key),
            delimiter,
            escapeFormulas,
          ),
        )
        .join(delimiter),
    );
  }

  for (const row of rows) {
    lines.push(
      columns
        .map((header) => {
          const value = resolvePath(row, header.key);
          return escapeCsvField(
            stringifyCsvValue(
              header.display ? header.display(value, row) : value,
            ),
            delimiter,
            escapeFormulas,
          );
        })
        .join(delimiter),
    );
  }

  return lines.join(newline);
}
