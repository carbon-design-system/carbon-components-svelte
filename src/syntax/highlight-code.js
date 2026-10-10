// @ts-check
import { tokenize } from "./tokenize.js";

/**
 * @typedef {{ language: string; code?: string }} HighlightCodeOptions
 * `code` is not read; pass it so the action re-highlights when it changes.
 */

/**
 * Color the code inside `node` with the CSS Custom Highlight API: one
 * tokenize, one `Range` per token, registered under `syntax-<type>` (styled
 * by `syntax.css`). The DOM is untouched, so selection and copy see plain
 * text. Highlights the first `<code>` inside `node`, or `node` itself, so it
 * works on a `<pre>`, a `<code>`, or a wrapper around a CodeSnippet.
 *
 * A Svelte action: `<pre use:highlightCode={{ language: "ts", code }}>`.
 * Without Highlight API support (`CSS.highlights`) it does nothing.
 * @param {HTMLElement} node
 * @param {string | HighlightCodeOptions} options - a language, or options
 * @returns {{ update: (options: string | HighlightCodeOptions) => void; destroy: () => void }}
 */
export function highlightCode(node, options) {
  /** @type {Map<string, Range[]>} */
  let owned = new Map();

  const clear = () => {
    for (const [name, ranges] of owned) {
      const registered = CSS.highlights.get(name);
      if (!registered) continue;
      for (const range of ranges) registered.delete(range);
      if (registered.size === 0) CSS.highlights.delete(name);
    }
    owned = new Map();
  };

  /** @param {string | HighlightCodeOptions} next */
  const paint = (next) => {
    if (typeof CSS === "undefined" || !("highlights" in CSS)) return;
    clear();
    const language = typeof next === "string" ? next : next.language;
    const root = node.querySelector("code") ?? node;
    const texts = textNodes(root);
    const tokens = tokenize(texts.map((text) => text.data).join(""), language);
    if (!tokens) return;

    let index = 0;
    let base = 0;
    let offset = 0;
    /**
     * The text node and local offset at absolute `at`, moving forward only.
     * @param {number} at
     * @returns {[Text, number]}
     */
    const locate = (at) => {
      while (index < texts.length - 1 && at >= base + texts[index].length) {
        base += texts[index].length;
        index++;
      }
      return [texts[index], at - base];
    };

    for (const token of tokens) {
      const start = offset;
      offset += token.text.length;
      if (!token.type) continue;
      const range = new Range();
      range.setStart(...locate(start));
      range.setEnd(...locate(offset));
      const name = `syntax-${token.type}`;
      let registered = CSS.highlights.get(name);
      if (!registered) {
        registered = new Highlight();
        CSS.highlights.set(name, registered);
      }
      registered.add(range);
      const list = owned.get(name);
      if (list) list.push(range);
      else owned.set(name, [range]);
    }
  };

  paint(options);

  return {
    update: paint,
    destroy: () => {
      if (typeof CSS !== "undefined" && "highlights" in CSS) clear();
    },
  };
}

/**
 * The text nodes under `root`, in document order.
 * @param {Node} root
 * @returns {Text[]}
 */
function textNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  /** @type {Text[]} */
  const nodes = [];
  while (walker.nextNode())
    nodes.push(/** @type {Text} */ (walker.currentNode));
  return nodes;
}
