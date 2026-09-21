/**
 * An id that no other call has returned. A counter, not a random string, so
 * a server render and the browser's first render agree as long as they
 * create components in the same order.
 */
export function nextId(prefix: string): string;
