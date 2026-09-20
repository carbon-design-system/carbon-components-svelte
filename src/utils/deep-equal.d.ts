/**
 * Deep equality check for values (nested objects and arrays).
 * `Date`s compare by time, `RegExp`s by source and flags, functions by
 * identity. Handles circular references.
 */
export function deepEqual(a: unknown, b: unknown): boolean;
