/**
 * Start an id scope for the calling component and everything it renders, and
 * return its prefix: `id`, or `useId(name)` when `id` is empty. A `useId()`
 * call below it returns a deterministic id from the prefix. Call it during
 * component init.
 */
export function createIdScope(id?: string, name?: string): string;

/**
 * Generate an id during component init: `${prefix}-${n}` (or
 * `${prefix}-${name}-${n}`) inside an id scope, a random
 * `uniqueId(fallbackPrefix)` outside one.
 */
export function useId(name?: string, fallbackPrefix?: string): string;
