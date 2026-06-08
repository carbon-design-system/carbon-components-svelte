/**
 * Typeahead matching for listbox keyboard navigation.
 */

/** Next enabled item whose text starts with `query`, or `index` if none. */
export function typeaheadIndex<T>(options: {
  items: ReadonlyArray<T>;
  query: string;
  itemToString: (item: T) => string;
  index: number;
  /** @default item => item.disabled */
  isDisabled?: (item: T) => boolean;
}): number;
