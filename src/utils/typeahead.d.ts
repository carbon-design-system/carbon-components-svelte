/**
 * Typeahead matching for listbox keyboard navigation.
 */

/**
 * Next enabled item whose text starts with `query`, or `index` if none.
 */
export function typeaheadIndex<T>(options: {
  items: ReadonlyArray<T>;
  query: string;
  itemToString: (item: T) => string;
  index: number;
  /** @default item => item.disabled */
  isDisabled?: (item: T) => boolean;
}): number;

/**
 * Whether `event` is an unmodified printable key (not Space) for
 * typeahead.
 */
export function isTypeaheadKey(event: KeyboardEvent): boolean;

/**
 * Typed-character query that resets after `delay` ms (default 500)
 * idle.
 */
export function createTypeaheadBuffer(delay?: number): {
  /**
   * Append `character` (lowercased) and return the accumulated query.
   */
  push: (character: string) => string;
  /** Reset the query and cancel the pending idle reset. */
  clear: () => void;
};
