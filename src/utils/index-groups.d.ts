export const INDEX_OTHER: "#";

export type IndexGroup<Item> = {
  /** The letter on the rail and on the section header. */
  key: string;
  /** The section's items, sorted. */
  items: Item[];
};

/**
 * A collator for `locale`, cached. Digits sort by value (`Item 2` before
 * `Item 10`).
 */
export function getIndexCollator(locale: string): Intl.Collator;

/** The letters a locale's index shows, in order, without the `#` bucket. */
export function getIndexAlphabet(locale?: string): ReadonlyArray<string>;

/**
 * The index letter a piece of text files under.
 *
 * It looks at the first character only. Case, accents, katakana against
 * hiragana, voicing marks, Arabic hamza forms and Hebrew final forms are
 * folded, so `ä` files under `A` in German and under `Ä` in Swedish. A
 * character the locale's alphabet does not hold, such as a digit or a
 * symbol, files under `#`. Han characters file under their pinyin initial
 * in Chinese, using the collator, with no table of characters.
 */
export function getIndexKey(
  text: string,
  locale?: string,
  alphabet?: ReadonlyArray<string>,
): string;

/**
 * Sort items and file them under index letters.
 *
 * Without `groupBy`, an item files under `getIndexKey` of its sort text, in
 * the locale's alphabet, and the result holds every letter of it (empty ones
 * included, for the rail to disable) followed by `#`. With `groupBy`, the
 * result holds `sections`, or the keys it returned in collation order with
 * `#` last. An item whose key is not among `sections` files under `#`.
 */
export function groupIndexItems<Item>(
  items: ReadonlyArray<Item>,
  options?: {
    /** Text to sort and group by. Defaults to the item's `text`. */
    sortKey?: (item: Item) => string;
    locale?: string;
    groupBy?: (item: Item, locale: string) => string;
    /** The index letters, in order. */
    sections?: ReadonlyArray<string>;
    /** Set to `false` for items already in order. */
    sort?: boolean;
  },
): IndexGroup<Item>[];
