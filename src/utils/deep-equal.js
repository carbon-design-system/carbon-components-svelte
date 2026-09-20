// @ts-check

/**
 * Deep equality check for values (nested objects and arrays).
 * @param {*} a - First value to compare
 * @param {*} b - Second value to compare
 * @param {WeakMap<*, Set<*>>} [stack] - WeakMap used to track circular references
 * @returns {boolean} True if values are deeply equal, false otherwise
 */
export function deepEqual(a, b, stack = new WeakMap()) {
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
    // `Map`, `Set`, DOM nodes, and class instances keep their state outside
    // own enumerable keys, so walking keys would call two different ones
    // equal. Reference equality was already ruled out above.
    if (!isPlainObject(a) || !isPlainObject(b)) return false;

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
 * @param {object} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
