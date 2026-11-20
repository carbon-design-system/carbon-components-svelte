// @ts-check
// Where a character of a text sits on screen, read from the DOM that draws it.

/**
 * The box of the character at `offset` in the text of `root`, counted over
 * all its text nodes in order. At the end of the text, the box of the last
 * character, with `after` set: the place wanted is its far edge. `null`
 * when `root` holds no text.
 * @param {Element} root
 * @param {number} offset
 * @returns {{ rect: DOMRect, after: boolean } | null}
 */
export function textRectAt(root, offset) {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  let position = 0;
  /** @type {Text | null} */
  let last = null;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = /** @type {Text} */ (node);
    const length = text.data.length;
    if (length === 0) continue;
    if (offset < position + length) {
      return rectOf(charRect(doc, text, offset - position), false);
    }
    position += length;
    last = text;
  }
  if (!last) return null;
  return rectOf(charRect(doc, last, last.data.length - 1), true);
}

/**
 * @param {Document} doc
 * @param {Text} node
 * @param {number} index
 */
function charRect(doc, node, index) {
  const range = doc.createRange();
  range.setStart(node, index);
  range.setEnd(node, index + 1);
  // jsdom has no layout, and no `getBoundingClientRect` on a range.
  return typeof range.getBoundingClientRect === "function"
    ? range.getBoundingClientRect()
    : null;
}

/**
 * @param {DOMRect | null} rect
 * @param {boolean} after
 */
function rectOf(rect, after) {
  return rect ? { rect, after } : null;
}
