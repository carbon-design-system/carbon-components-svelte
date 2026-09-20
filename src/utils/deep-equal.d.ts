/**
 * Deep equality check for values (nested objects and arrays).
 * `Date`s compare by time, `RegExp`s by source and flags, functions by
 * identity, and so do non-plain objects (`Map`, `Set`, DOM nodes, class
 * instances). Handles circular references.
 */
export function deepEqual(a: unknown, b: unknown): boolean;
