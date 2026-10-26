// @ts-check
import { tokenize } from "./tokenize.js";

/** @typedef {{ language: string }} HighlightCodeOptions */

/**
 * Color the code inside `node` with the CSS Custom Highlight API: one
 * tokenize, one `StaticRange` per token, registered under `syntax-<type>`
 * (styled by `syntax.css`). The DOM is untouched, so selection and copy see
 * plain text. Highlights the first `<code>` inside `node`, or `node` itself,
 * so it works on a `<pre>`, a `<code>`, or a wrapper around a CodeSnippet.
 *
 * A static range costs the page nothing on a DOM change, unlike a live
 * `Range`, which the browser updates on every change anywhere in the
 * document. It also does not follow its text, so a `MutationObserver` on
 * `node` re-highlights when the code's text or nodes change, whether
 * Svelte or other code changes them.
 *
 * A Svelte action: `<pre use:highlightCode={"ts"}>`.
 * Without Highlight API support (`CSS.highlights`) it does nothing.
 * @param {HTMLElement} node
 * @param {string | HighlightCodeOptions} options - a language, or options
 * @returns {{ update: (options: string | HighlightCodeOptions) => void; destroy: () => void }}
 */
export function highlightCode(node, options) {
  if (typeof CSS === "undefined" || !("highlights" in CSS)) {
    return { update: () => {}, destroy: () => {} };
  }

  let language = typeof options === "string" ? options : options.language;
  /** @type {Map<string, StaticRange[]>} */
  let owned = new Map();
  const target = () => node.querySelector("code") ?? node;
  let root = target();

  const clear = () => {
    for (const [name, ranges] of owned) {
      const registered = CSS.highlights.get(name);
      if (!registered) continue;
      for (const range of ranges) registered.delete(range);
      if (registered.size === 0) CSS.highlights.delete(name);
    }
    owned = new Map();
  };

  const paint = () => {
    // This paint reads the current DOM, so drop changes queued before it.
    observer.takeRecords();
    clear();
    root = target();
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
      const [startContainer, startOffset] = locate(start);
      const [endContainer, endOffset] = locate(offset);
      const range = new StaticRange({
        startContainer,
        startOffset,
        endContainer,
        endOffset,
      });
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

  // Skip changes beside the code, such as a CodeSnippet's button text.
  const observer = new MutationObserver((records) => {
    if (
      target() !== root ||
      records.some((record) => root.contains(record.target))
    ) {
      paint();
    }
  });
  observer.observe(node, {
    characterData: true,
    childList: true,
    subtree: true,
  });

  paint();

  return {
    update: (next) => {
      language = typeof next === "string" ? next : next.language;
      paint();
    },
    destroy: () => {
      observer.disconnect();
      clear();
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
