// @ts-check
/**
 * Svelte action: while the pointer is over `node`, give it a `title` with
 * its full text when the text is cut off (an ellipsis), and none otherwise,
 * so the full text shows on hover without being announced twice.
 * @param {HTMLElement} node
 */
export function titleWhenTruncated(node) {
  function update() {
    if (node.scrollWidth > node.clientWidth) {
      node.title = node.textContent?.trim() ?? "";
    } else {
      node.removeAttribute("title");
    }
  }
  node.addEventListener("mouseenter", update);
  return {
    destroy() {
      node.removeEventListener("mouseenter", update);
    },
  };
}
