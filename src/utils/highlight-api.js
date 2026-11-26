// @ts-check
import { createTextMatcher } from "./text-match.js";

/**
 * @typedef {import("./text-match.js").TextMatchOptions & { query?: string | ReadonlyArray<string> | null }} HighlightTextParams
 */

/** The `::highlight()` name the `all.css` rule styles. */
export const HIGHLIGHT_NAME = "ccs-text-highlight";

/** @type {Map<Node, Range[]>} */
const registry = new Map();

/**
 * Whether the browser can paint a `::highlight()` without changing the DOM.
 *
 * @returns {boolean}
 */
export function supportsHighlightApi() {
  return (
    typeof CSS !== "undefined" &&
    "highlights" in CSS &&
    typeof Highlight === "function" &&
    typeof Range === "function"
  );
}

/** One `Highlight` holds every container's ranges, so several can coexist. */
function publish() {
  const ranges = [...registry.values()].flat();
  if (ranges.length === 0) {
    CSS.highlights.delete(HIGHLIGHT_NAME);
  } else {
    CSS.highlights.set(HIGHLIGHT_NAME, new Highlight(...ranges));
  }
}

/**
 * @param {Node} root
 * @param {(text: string) => import("./text-match.js").TextRange[]} matcher
 * @returns {Range[]}
 */
function collect(root, matcher) {
  /** @type {Range[]} */
  const found = [];
  const doc = root.ownerDocument;
  if (!doc) return found;
  const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const data = /** @type {Text} */ (node).data;
    if (!data.trim()) continue;
    for (const { start, end } of matcher(data)) {
      const range = doc.createRange();
      range.setStart(node, start);
      range.setEnd(node, end);
      found.push(range);
    }
  }
  return found;
}

/**
 * Svelte action: paint matches of `query` inside the element with the CSS
 * Custom Highlight API, leaving the DOM as it is. It suits a large block of text
 * or a table, where wrapping every match in a `<mark>` costs more than the
 * match. Nothing happens where the API is missing, so pair it with `Highlight`
 * as the fallback.
 *
 * Matches do not cross text nodes, and the paint is limited to color, background
 * and text decoration. Assistive technology does not see the highlight.
 * SSR-safe: it runs only in the browser.
 *
 * @param {HTMLElement} node
 * @param {HighlightTextParams} [params]
 * @returns {{ update: (params?: HighlightTextParams) => void, destroy: () => void }}
 */
export function highlightText(node, params) {
  let current = params;
  /** @type {MutationObserver | null} */
  let observer = null;

  function scan() {
    const { query, ...options } = current ?? {};
    registry.set(node, collect(node, createTextMatcher(query, options)));
    publish();
  }

  if (!supportsHighlightApi()) {
    return { update() {}, destroy() {} };
  }

  scan();
  // Svelte patches the DOM after an action's `update`, so rescan when the
  // text changes too.
  if (typeof MutationObserver === "function") {
    observer = new MutationObserver(scan);
    observer.observe(node, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  return {
    update(next) {
      current = next;
      scan();
    },
    destroy() {
      observer?.disconnect();
      registry.delete(node);
      publish();
    },
  };
}
