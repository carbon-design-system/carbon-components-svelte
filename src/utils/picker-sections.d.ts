export type PickerSections<Item> = {
  /** Every cell in display order. A recent item in a category appears in both sections. */
  list: Item[];
  /** Cells in each section. */
  counts: number[];
  /** Section ids: `"recent"`, a category id, `"uncategorized"`, or `"results"`. */
  ids: string[];
  /** Section labels, `""` for a section with no header. */
  labels: string[];
  /** Whether each section has a header row. */
  headers: boolean[];
};

/** Group the items of a picker into the recent section and one section per category. */
export function buildPickerSections<
  Item extends { id: string; category?: string },
>(options: {
  items: ReadonlyArray<Item>;
  /** The order and labels of the categories. A category not listed follows, in order of first appearance. */
  categories?: ReadonlyArray<{ id: string; label?: string }>;
  /** The recently used items, newest first. */
  recent?: ReadonlyArray<Item>;
  /** Header of the recent section. */
  recentText?: string;
  /** Header of the items with no category, when others have one or there is a recent section. */
  otherText?: string;
  /** `false` lays every item out in one section with no header, for search results. */
  grouped?: boolean;
}): PickerSections<Item>;
