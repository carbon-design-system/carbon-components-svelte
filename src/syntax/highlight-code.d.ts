export interface HighlightCodeOptions {
  language: string;
  /** Not read; pass it so the action re-highlights when the code changes. */
  code?: string;
}

/**
 * Color the code inside `node` with the CSS Custom Highlight API, without
 * changing the DOM. Highlights the first `<code>` inside `node`, or `node`
 * itself. A Svelte action: `<pre use:highlightCode={{ language: "ts", code }}>`.
 * Does nothing where `CSS.highlights` is unsupported.
 */
export function highlightCode(
  node: HTMLElement,
  options: string | HighlightCodeOptions,
): {
  update: (options: string | HighlightCodeOptions) => void;
  destroy: () => void;
};
