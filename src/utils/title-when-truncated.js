// @ts-check
import { isTruncated } from "./truncation.js";

/**
 * Svelte action: while the pointer is over `node`, give it a `title` with
 * its full text when the text is cut off (an ellipsis), and none otherwise,
 * so the full text shows on hover without being announced twice.
 *
 * It measures on `mouseenter`, so the `title` follows any change to the
 * text or the width without an observer, and a page of these costs one
 * listener each and no layout until the pointer arrives.
 *
 * `options.measure` names a descendant (a selector) whose text is the one
 * that truncates, such as a label inside a button. Falls back to `node`.
 *
 * @param {HTMLElement} node
 * @param {import("./title-when-truncated.js").TitleWhenTruncatedOptions} [options]
 * @example
 * <span use:titleWhenTruncated>{text}</span>
 * <button use:titleWhenTruncated={{ measure: ".bx--progress-label" }}>...</button>
 */
export function titleWhenTruncated(node, options = {}) {
  let latest = options;

  function update() {
    const measured =
      (latest.measure && node.querySelector(latest.measure)) || node;
    if (measured instanceof HTMLElement && isTruncated(measured)) {
      node.title = measured.textContent?.trim() ?? "";
    } else {
      node.removeAttribute("title");
    }
  }

  node.addEventListener("mouseenter", update);

  return {
    /** @param {import("./title-when-truncated.js").TitleWhenTruncatedOptions} [next] */
    update(next = {}) {
      latest = next;
    },
    destroy() {
      node.removeEventListener("mouseenter", update);
    },
  };
}
