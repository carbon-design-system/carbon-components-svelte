/** An item of a list: its text, or its text and a link. */
export type TruncatedListItem = string | { label: string; href?: string };

export type FormatListPartsOptions = {
  /**
   * Show this many items, then one "more" element for the rest. Leave it
   * unset to show every item.
   */
  max?: number;
  /** A BCP 47 language tag. Defaults to `"en"`. */
  locale?: string;
  /**
   * `"conjunction"` joins with "and", `"disjunction"` with "or", and
   * `"unit"` with no word. Defaults to `"conjunction"`.
   */
  type?: "conjunction" | "disjunction" | "unit";
  /** Defaults to `"long"`. */
  style?: "long" | "short" | "narrow";
  /**
   * The text of the "more" element, from the number of items it stands for.
   * Defaults to `3 more`, with the count in the locale's digits.
   */
  formatMore?: (count: number, locale: string) => string;
};

export type ListPart =
  | { type: "item"; value: string; item: TruncatedListItem; index: number }
  | { type: "more"; value: string; count: number }
  | { type: "literal"; value: string };

export function itemLabel(item: TruncatedListItem): string;

export function formatListParts(
  items: ReadonlyArray<TruncatedListItem>,
  options?: FormatListPartsOptions,
): ListPart[];

export function listPartsText(parts: ReadonlyArray<ListPart>): string;
