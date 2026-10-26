export interface HighlightCodeOptions {
  language: string;
}

/**
 * Color the code inside `node` with the CSS Custom Highlight API, without
 * changing the DOM. Registers one `StaticRange` per token, and re-highlights
 * when the code's text or nodes change. Highlights the first `<code>` inside
 * `node`, or `node` itself. A Svelte action:
 * `<pre use:highlightCode={"ts"}>`.
 * Does nothing where `CSS.highlights` is unsupported.
 */
export function highlightCode(
  node: HTMLElement,
  options: string | HighlightCodeOptions,
): {
  update: (options: string | HighlightCodeOptions) => void;
  destroy: () => void;
};
