import type { TextRange } from "./text-match.js";

export type TextSnippetOptions = {
  /**
   * The most UTF-16 units the snippet may have, ellipses included.
   * @default 120
   */
  maxLength?: number;
  /**
   * Units to keep on each side of a match.
   * @default 24
   */
  context?: number;
  /**
   * @default "…"
   */
  ellipsis?: string;
  /**
   * Joins the windows of separate matches. Defaults to the ellipsis between
   * spaces.
   */
  separator?: string;
};

export type TextSnippet = {
  /** The text to show. */
  text: string;
  /** The matches that fit, as offsets into `text`. */
  ranges: TextRange[];
  /** Whether any of the source text was left out. */
  truncated: boolean;
};

/**
 * Cut a long `text` down to the parts around its matches, with an ellipsis at
 * word boundaries and cuts on grapheme boundaries. When several matches fit,
 * their windows are joined. The result's `ranges` are offsets into the snippet.
 */
export function textSnippet(
  text: string,
  ranges: ReadonlyArray<TextRange> | null | undefined,
  options?: TextSnippetOptions,
): TextSnippet;
