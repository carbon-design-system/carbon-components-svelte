import type { Writable } from "svelte/store";

export interface QueryParamOptions<T> {
  /**
   * Value used when the parameter is missing or invalid.
   * Setting the store to this value removes the parameter.
   */
  defaultValue: T;
  /**
   * Convert the raw parameter; return `undefined` to reject it.
   * Defaults to coercing by the type of `defaultValue`.
   */
  parse?: (raw: string) => T | undefined;
  /** Convert a value to the parameter string. Defaults to `String`. */
  serialize?: (value: T) => string;
  /**
   * Write the new URL. Defaults to `history.replaceState`;
   * pass a router's navigation API instead.
   */
  replace?: (href: string) => void;
}

/**
 * A writable store mirrored to a URL query parameter. The initial value is
 * read from the URL; each `set` replaces the current history entry.
 * Back/forward navigation re-reads the parameter while subscribed.
 */
export function queryParam<T>(
  key: string,
  options: QueryParamOptions<T>,
): Writable<T>;
