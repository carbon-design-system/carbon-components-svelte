export type PickerSearchItem = {
  id: string;
  label: string;
  keywords?: ReadonlyArray<string>;
};

export type PickerIndexEntry<Item extends PickerSearchItem> = {
  item: Item;
  /** The label, lowercase, without accents. */
  text: string;
  /** The words of `text`. */
  words: string[];
  /** The keywords joined by a space. */
  keywords: string;
  keywordWords: string[];
};

/** Lowercase `text` and drop accents, so "cafe" finds "Café". */
export function normalizeSearchText(text: string): string;

/** Normalize the text of `items` once, for `searchPickerIndex`. */
export function createPickerIndex<Item extends PickerSearchItem>(
  items: ReadonlyArray<Item>,
): PickerIndexEntry<Item>[];

/**
 * The items that match every word of `query`, best match first. An empty
 * query matches everything, in order.
 */
export function searchPickerIndex<Item extends PickerSearchItem>(
  index: ReadonlyArray<PickerIndexEntry<Item>>,
  query: string,
): Item[];
