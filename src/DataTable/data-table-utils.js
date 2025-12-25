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
 * @template {Record<string, any>} Row - Row type with at least an optional `id` property
 * @param {ReadonlyArray<Row> | null} a - First array of rows to compare
 * @param {ReadonlyArray<Row> | null} b - Second array of rows to compare
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

const PATH_SPLIT_REGEX = /[.[\]'"]/;

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
  return path
    .split(PATH_SPLIT_REGEX)
    .filter((p) => p)
    .reduce((o, p) => (o && typeof o === "object" ? o[p] : o), object);
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
  if (customSort) return customSort(itemA, itemB);

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
      // String comparison with locale-aware numeric sorting
      result = String(itemA).localeCompare(String(itemB), "en", {
        numeric: true,
      });
    }
  }

  // Reverse result for descending order
  return ascending ? result : -result;
}
