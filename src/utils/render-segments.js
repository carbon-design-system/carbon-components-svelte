// @ts-check
// Draws `[{ text, className }]` into an element as spans of text. Text nodes
// only: a segment's text is never parsed as markup, and its class is a
// string, so a value that holds `<img onerror=...>` is drawn as characters.

/**
 * @typedef {Object} InputLayerSegment
 * @property {string} text The characters of the run.
 * @property {string} [className] Classes for the run's `<span>`.
 * @property {boolean} [ghost] Text that is not in the field's value, such as
 * a suggestion after the caret. It is drawn after the value, is not counted
 * in the characters that `caretRect` and `rangeRects` index, and can be
 * checked for moving the value's own text with `ghostShifts`.
 */

/** The class of a span that holds text that is not the field's. */
export const GHOST = "bx--input-layer__ghost";

/** Zero width space: keeps a final empty line of a textarea in the layer. */
const BREAK = String.fromCodePoint(0x200b);

/**
 * Make the children of `parent` a `<span>` for each segment, reusing the
 * spans already there. Typing one character changes one text node. An empty
 * segment draws nothing.
 *
 * With `trailingBreak`, an empty text, or one ending in a newline, gets one
 * more span that holds a zero width space, because a `pre-wrap` block drops
 * the empty line after a final newline and a textarea shows it, and an empty
 * block has no line to measure a caret on.
 *
 * @param {Element} parent
 * @param {ReadonlyArray<InputLayerSegment>} segments
 * @param {{ trailingBreak?: boolean }} [options]
 * @returns {string} The text that was drawn, not counting the break.
 */
export function renderSegments(parent, segments, options = {}) {
  const doc = parent.ownerDocument;
  let index = 0;
  let drawn = "";
  /** @type {string} */
  let pending = "";
  /** @type {string | undefined} */
  let pendingClass;

  // Neighbours of one class are one span: Chromium rounds the width of each
  // run up to 1/64 px, so every extra span pushes the text after it right
  // by about 0.009 px.
  for (const segment of segments) {
    const text = String(segment.text ?? "");
    if (text === "") continue;
    const className = segment.className || undefined;
    if (segment.ghost) {
      if (pending !== "") {
        index = place(parent, doc, index, pending, pendingClass);
        pending = "";
      }
      index = place(
        parent,
        doc,
        index,
        text,
        className ? `${GHOST} ${className}` : GHOST,
      );
      continue;
    }
    drawn += text;
    if (pending !== "" && className === pendingClass) {
      pending += text;
      continue;
    }
    if (pending !== "")
      index = place(parent, doc, index, pending, pendingClass);
    pending = text;
    pendingClass = className;
  }
  if (pending !== "") index = place(parent, doc, index, pending, pendingClass);

  if (options.trailingBreak && (drawn === "" || drawn.endsWith("\n"))) {
    index = place(parent, doc, index, BREAK, undefined);
  }

  while (parent.childNodes.length > index) {
    /** @type {ChildNode} */ (parent.lastChild).remove();
  }
  return drawn;
}

/**
 * @param {Element} parent
 * @param {Document} doc
 * @param {number} index
 * @param {string} text
 * @param {string | undefined} className
 * @returns {number} The next index.
 */
function place(parent, doc, index, text, className) {
  let span = /** @type {HTMLElement | undefined} */ (parent.children[index]);
  if (span) {
    if (span.textContent !== text) span.textContent = text;
  } else {
    span = doc.createElement("span");
    span.textContent = text;
    parent.appendChild(span);
  }
  const next = className ?? "";
  if (span.className !== next) {
    if (next) span.className = next;
    else span.removeAttribute("class");
  }
  return index + 1;
}
