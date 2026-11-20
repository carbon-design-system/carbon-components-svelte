export type SettingsSearchItem = {
  id: string;
  label: string;
  description?: string;
  /** Words the label does not say, such as "e-mail" for "Email digest". */
  keywords?: ReadonlyArray<string>;
};

export type SettingsSearchSection = {
  id: string;
  title: string;
  description?: string;
  keywords?: ReadonlyArray<string>;
  items: ReadonlyArray<SettingsSearchItem>;
};

export type SettingsSearchItemResult = {
  id: string;
  /** Whether the item shows. */
  matched: boolean;
  /** Character indices of `label` to highlight, for `highlightSegments`. */
  labelIndices: number[];
  /** Character indices of `description` to highlight. */
  descriptionIndices: number[];
};

export type SettingsSearchSectionResult = {
  id: string;
  /** Whether the section shows: it, or one of its items, matched. */
  matched: boolean;
  titleIndices: number[];
  items: SettingsSearchItemResult[];
};

export type SettingsSearchResult = {
  /** The trimmed query. */
  query: string;
  /** How many items show. */
  count: number;
  sections: SettingsSearchSectionResult[];
};

export type FilterSettingsOptions = {
  /**
   * The weakest match that counts, from 0 to 1 as in `fuzzyMatch`. The
   * default, `0.5`, needs a contiguous run of letters, so "pas" finds
   * "Password" but "pwd" does not.
   * @default 0.5
   */
  threshold?: number;
};

/**
 * Filter settings by label, description and keywords. Every word of the
 * query must match somewhere in an item, its section's title, description or
 * keywords. A section that matches shows all its items; otherwise it shows
 * the items that match. An empty query matches everything.
 */
export function filterSettings(
  sections: ReadonlyArray<SettingsSearchSection>,
  query: string,
  options?: FilterSettingsOptions,
): SettingsSearchResult;
