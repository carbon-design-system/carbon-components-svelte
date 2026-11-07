/** How many characters of text are kept on each side of a quote. */
export const CONTEXT_LENGTH: 32;

export type TextRange = { start: number; end: number };

export type TextAnchor = {
  range: TextRange;
  /** The text the range covered when the anchor was made. */
  quote: string;
  /** The text just before the quote. */
  prefix?: string;
  /** The text just after the quote. */
  suffix?: string;
};

/**
 * `exact` when the offsets still hold the quote, `moved` when the quote is
 * somewhere else, `fuzzy` when only a close match to it is left, and
 * `orphaned` when nothing is.
 */
export type AnchorStatus = "exact" | "moved" | "fuzzy" | "orphaned";

export type AnchorResult = {
  start: number;
  end: number;
  status: AnchorStatus;
};

export type LocateOptions = {
  /** The share of the quote that may differ, from 0 to 1. Default 0.3. */
  maxDistance?: number;
};

/** Describe the text between two offsets as an anchor. */
export function createAnchor(
  text: string,
  start: number,
  end: number,
  options?: { context?: number },
): Required<TextAnchor>;

/** Where an anchor sits in `text` now. */
export function locateAnchor(
  text: string,
  anchor: TextAnchor,
  options?: LocateOptions,
): AnchorResult;

/** Anchor several annotations to `text`, in the order given. */
export function locateAnchors(
  text: string,
  anchors: ReadonlyArray<TextAnchor>,
  options?: LocateOptions,
): AnchorResult[];
