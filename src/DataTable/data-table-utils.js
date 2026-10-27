// @ts-check
import { BoundedFifoCache } from "../utils/bounded-fifo-cache.js";
import { toCssLength } from "../utils/css-length.js";
import { deepEqual } from "../utils/deep-equal.js";

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
  const element = /** @type {HTMLElement} */ (target);
  return [...element.classList].some((name) => RE_IGNORE_ROW_CLICK.test(name));
}

const PATH_SPLIT_REGEX = /[.[\]'"]/;
const MAX_PATH_CACHE_SIZE = 1000;
/** @type {BoundedFifoCache<string, string[]>} */
const pathCache = new BoundedFifoCache(MAX_PATH_CACHE_SIZE);

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
 * Indices of the rendered columns, in render order. Hidden columns drop out
 * and pinned columns move to their edge: `"start"` pins first, `"end"` pins
 * last, each group keeping its order in `headers`. A pin then never needs a
 * reorder of `headers`, and DOM order stays equal to visual order.
 * @param {ReadonlyArray<{ columnHidden?: boolean; columnPinned?: "start" | "end" }>} headers
 * @returns {number[]}
 */
export function resolveColumnOrder(headers) {
  /** @type {number[]} */
  const start = [];
  /** @type {number[]} */
  const center = [];
  /** @type {number[]} */
  const end = [];
  headers.forEach((header, index) => {
    if (header.columnHidden) return;
    if (header.columnPinned === "start") start.push(index);
    else if (header.columnPinned === "end") end.push(index);
    else center.push(index);
  });
  return start.length || end.length ? [...start, ...center, ...end] : center;
}

// `%` is relative to a different box for `width` (the table) and for an
// inset (the scrollport), so only absolute units can be summed up front.
const RE_NUMBER = /^\d*\.?\d+/;
const RE_ABSOLUTE_LENGTH = /^\d*\.?\d+(?:px|rem|em|ch|ex|vw|vh|vmin|vmax)$/;

/**
 * @param {string | number | undefined} width
 * @param {number | undefined} measured
 * @returns {string}
 */
function columnLength(width, measured) {
  if (measured !== undefined) return `${measured}px`;
  const length = toCssLength(width);
  return typeof length === "string" && RE_ABSOLUTE_LENGTH.test(length.trim())
    ? length.trim()
    : "0px";
}

/** @param {string[]} terms */
function sumLengths(terms) {
  const nonZero = terms.filter((term) => Number.parseFloat(term) !== 0);
  if (nonZero.length === 0) return "0px";
  if (nonZero.length === 1) return nonZero[0];
  // One unit sums to one number, so an all-px or all-rem run stays a plain length.
  const unit = nonZero[0].replace(RE_NUMBER, "");
  if (nonZero.every((term) => term.replace(RE_NUMBER, "") === unit)) {
    const total = nonZero.reduce(
      (sum, term) => sum + Number.parseFloat(term),
      0,
    );
    return `${Math.round(total * 100) / 100}${unit}`;
  }
  return `calc(${nonZero.join(" + ")})`;
}

/**
 * @typedef {object} PinnedColumnLayout
 * @property {"start" | "end"} side - The edge the column is pinned to.
 * @property {string} offset - CSS length from that edge, the summed widths of the pinned columns before it.
 * @property {boolean} edge - Whether the column is the pinned column nearest the scrolling area.
 */

/**
 * Where each pinned column sticks. `columns` are the rendered columns in
 * render order, leading ones included (expand, selection and decorator
 * columns, flagged `leading`). The leading columns pin with the start group
 * and are left alone when there is none.
 *
 * Offsets come from declared widths, so server output and first paint are
 * right. A `measured` width (in px, by column index) wins over a declared
 * one. A column with neither counts as zero wide.
 * @param {ReadonlyArray<{ pin?: "start" | "end"; leading?: boolean; width?: string | number }>} columns
 * @param {ReadonlyArray<number | undefined>} [measured]
 * @returns {null | Array<PinnedColumnLayout | undefined>} `null` when no column is pinned.
 */
export function computePinnedOffsets(columns, measured = []) {
  const hasStart = columns.some(
    (column) => !column.leading && column.pin === "start",
  );
  const hasEnd = columns.some(
    (column) => !column.leading && column.pin === "end",
  );
  if (!hasStart && !hasEnd) return null;

  /** @type {Array<PinnedColumnLayout | undefined>} */
  const layouts = new Array(columns.length).fill(undefined);
  const lengths = columns.map((column, index) =>
    columnLength(column.width, measured[index]),
  );

  /** @type {string[]} */
  let terms = [];
  let startEdge = -1;
  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    if (column.leading ? !hasStart : column.pin !== "start") continue;
    layouts[i] = { side: "start", offset: sumLengths(terms), edge: false };
    terms.push(lengths[i]);
    startEdge = i;
  }

  terms = [];
  let endEdge = -1;
  for (let i = columns.length - 1; i >= 0; i--) {
    if (columns[i].leading || columns[i].pin !== "end") continue;
    layouts[i] = { side: "end", offset: sumLengths(terms), edge: false };
    terms.push(lengths[i]);
    endEdge = i;
  }

  if (startEdge >= 0)
    /** @type {PinnedColumnLayout} */ (layouts[startEdge]).edge = true;
  if (endEdge >= 0)
    /** @type {PinnedColumnLayout} */ (layouts[endEdge]).edge = true;
  return layouts;
}

/**
 * Class attribute for a cell: `classes` plus, for a pinned column, the pin
 * classes. `undefined` when there is nothing to set.
 * @param {PinnedColumnLayout | undefined} pin
 * @param {...(string | undefined)} classes
 * @returns {string | undefined}
 */
export function formatPinnedClass(pin, ...classes) {
  const names = classes.filter(Boolean);
  if (pin) {
    names.push(`bx--table-column--pinned-${pin.side}`);
    if (pin.edge) names.push(`bx--table-column--pinned-${pin.side}-edge`);
  }
  return names.length > 0 ? names.join(" ") : undefined;
}

/**
 * Inline style for a pinned cell: its offset from its edge. The stylesheet
 * turns it into `left` or `right` by direction.
 * @param {PinnedColumnLayout | undefined} pin
 * @returns {string | undefined}
 */
export function formatInsetStyle(pin) {
  return pin ? `--ccs-pinned-offset: ${pin.offset}` : undefined;
}

/**
 * Inline style for a header cell: its width, and for a pinned column the
 * logical inset from its edge.
 * @param {{ width?: string | null | number; minWidth?: string | null | number }} header
 * @param {PinnedColumnLayout | undefined} pin
 * @returns {string | undefined}
 */
export function formatColumnStyle(header, pin) {
  const width = formatHeaderWidth(header);
  const inset = formatInsetStyle(pin);
  return width && inset ? `${width};${inset}` : (width ?? inset);
}

// Cached collator for compareValues' string fast path. localeCompare(str,
// locale, options) rebuilds the full ICU collator on every call when an
// options object is passed — reusing one Intl.Collator's .compare() instead
// is ~30x faster at scale. Locale is undefined so it defaults to the user's
// locale, matching localeCompare's prior behavior.
const collator = new Intl.Collator(undefined, {
  // Enable numeric sorting for strings that look like numbers
  // E.g., "10" should come after "2"
  numeric: true,
  // Comparison is case- and accent-insensitive
  // E.g., "apple" == "Apple", "café" == "cafe"
  sensitivity: "base",
});

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
      result = collator.compare(String(itemA), String(itemB));
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
 * @property {boolean} [columnHidden] - Whether the column is hidden; hidden columns are skipped
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
 * Skips empty and hidden columns, resolves nested keys, and applies `display`
 * formatting so the export matches the rendered table.
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

  const columns = headers.filter(
    (header) => !header.empty && !header.columnHidden,
  );
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
