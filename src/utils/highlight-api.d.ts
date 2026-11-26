import type { TextMatchOptions } from "./text-match.js";

export type HighlightTextParams = TextMatchOptions & {
  /** What to paint. A string is split on whitespace into terms. */
  query?: string | ReadonlyArray<string> | null;
};

/** The `::highlight()` name the `all.css` rule styles. */
export const HIGHLIGHT_NAME: "ccs-text-highlight";

/** Whether the browser can paint a `::highlight()` without changing the DOM. */
export function supportsHighlightApi(): boolean;

/**
 * Svelte action: paint matches of `query` inside the element with the CSS
 * Custom Highlight API, leaving the DOM as it is. Does nothing where the API is
 * missing.
 */
export function highlightText(
  node: HTMLElement,
  params?: HighlightTextParams,
): {
  update: (params?: HighlightTextParams) => void;
  destroy: () => void;
};
