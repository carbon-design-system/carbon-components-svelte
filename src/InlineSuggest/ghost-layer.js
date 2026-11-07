// @ts-check
// Places `InlineSuggest`'s layer over a text field so that a copy of the
// field's text lines up with the field's own. The field is the source of
// truth: its computed text styles are copied onto the layer whenever the
// layer is placed, so a restyled field needs no matching change here.

/**
 * Text styles that move a glyph or a line break. Copying all of them is
 * what keeps the layer's wrapping the same as the field's.
 */
const MIRRORED = /** @type {const} */ ([
  "direction",
  "unicodeBidi",
  "writingMode",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "fontStretch",
  "fontKerning",
  "fontFeatureSettings",
  "fontVariantLigatures",
  "letterSpacing",
  "wordSpacing",
  "lineHeight",
  "textTransform",
  "textIndent",
  "textAlign",
  "textRendering",
  "tabSize",
  "wordBreak",
  "overflowWrap",
  "hyphens",
]);

/** @param {string} px */
const toNumber = (px) => Number.parseFloat(px) || 0;

/**
 * Size the frame like the field and the layer like the field's text area,
 * and copy the text styles. A `<textarea>` scrolls its padding with its
 * text, so its layer is the padding box. An `<input>` scrolls the text
 * inside fixed padding, so its layer is the content box, with a line
 * as tall as the box to centre the text as the input does.
 *
 * @param {HTMLInputElement | HTMLTextAreaElement} field
 * @param {HTMLElement} frame
 * @param {HTMLElement} layer
 * @returns {{ multiline: boolean; rtl: boolean }}
 */
export function placeGhostLayer(field, frame, layer) {
  const style = getComputedStyle(field);
  const multiline = field.localName === "textarea";

  frame.style.left = `${field.offsetLeft}px`;
  frame.style.top = `${field.offsetTop}px`;
  frame.style.width = `${field.offsetWidth}px`;
  frame.style.height = `${field.offsetHeight}px`;

  const target = /** @type {Record<string, string>} */ (
    /** @type {unknown} */ (layer.style)
  );
  const source = /** @type {Record<string, string>} */ (
    /** @type {unknown} */ (style)
  );
  for (const name of MIRRORED) target[name] = source[name];

  const top = toNumber(style.paddingTop);
  const bottom = toNumber(style.paddingBottom);
  const left = toNumber(style.paddingLeft);
  const right = toNumber(style.paddingRight);

  if (multiline) {
    layer.style.left = `${field.clientLeft}px`;
    layer.style.top = `${field.clientTop}px`;
    layer.style.width = `${field.clientWidth}px`;
    layer.style.height = `${field.clientHeight}px`;
    layer.style.padding = `${top}px ${right}px ${bottom}px ${left}px`;
    layer.style.whiteSpace = style.whiteSpace;
  } else {
    // Firefox reports an `<input>`'s `clientLeft`, `clientWidth` and the
    // rest for its content box, not its padding box as the other engines
    // do, so the content box is built from the borders and padding.
    const borderLeft = toNumber(style.borderLeftWidth);
    const borderTop = toNumber(style.borderTopWidth);
    const height = Math.max(
      0,
      field.offsetHeight -
        borderTop -
        toNumber(style.borderBottomWidth) -
        top -
        bottom,
    );
    layer.style.left = `${borderLeft + left}px`;
    layer.style.top = `${borderTop + top}px`;
    layer.style.width = `${Math.max(
      0,
      field.offsetWidth -
        borderLeft -
        toNumber(style.borderRightWidth) -
        left -
        right,
    )}px`;
    layer.style.height = `${height}px`;
    layer.style.padding = "0";
    layer.style.lineHeight = `${height}px`;
    layer.style.whiteSpace = "pre";
  }
  return { multiline, rtl: style.direction === "rtl" };
}

/**
 * Follow the field's scroll. Setting `scrollTop` or `scrollLeft` on an
 * `overflow: hidden` box is allowed, and is exact: the layer holds the same
 * text, so the same offset shows the same part of it. Reads and writes
 * only what changed.
 *
 * @param {HTMLInputElement | HTMLTextAreaElement} field
 * @param {HTMLElement} layer
 * @returns {boolean} Whether the layer moved.
 */
export function followScroll(field, layer) {
  let moved = false;
  if (layer.scrollTop !== field.scrollTop) {
    layer.scrollTop = field.scrollTop;
    moved = true;
  }
  if (layer.scrollLeft !== field.scrollLeft) {
    layer.scrollLeft = field.scrollLeft;
    moved = true;
  }
  return moved;
}

/**
 * Whether the suggestion, once laid out after the typed copy, moves that
 * copy. It does when the line is aligned to the end the suggestion grows
 * towards (English text in a right to left field sits against the right
 * edge, so the line shifts left to make room), and when the suggestion
 * continues a word that no longer fits the line (the whole word wraps). The
 * field's own text does not move, so the suggestion would not sit where the
 * caret is. Needs the typed copy and the suggestion already painted.
 *
 * @param {Node} typedNode
 * @param {Node} ghostNode
 * @returns {boolean}
 */
export function ghostShiftsTyped(typedNode, ghostNode) {
  const text = typedNode.firstChild;
  if (!text || !ghostNode.firstChild) return false;
  const length = /** @type {string} */ (text.nodeValue).length;
  const range = /** @type {Document} */ (typedNode.ownerDocument).createRange();
  // A DOM with no layout (jsdom) has no rectangles to compare.
  if (typeof range.getBoundingClientRect !== "function") return false;
  /** @param {number} start @param {number} end */
  const rect = (start, end) => {
    range.setStart(text, start);
    range.setEnd(text, end);
    return range.getBoundingClientRect();
  };
  // The first character shows a sideways move, the last a line change.
  // Joined scripts reshape the last letters when more text follows (an
  // Arabic letter changes form), so their width is not compared.
  const first = rect(0, 1);
  const last = rect(length - 1, length);
  const ghost = /** @type {string} */ (ghostNode.textContent);
  ghostNode.textContent = "";
  const firstBefore = rect(0, 1);
  const lastBefore = rect(length - 1, length);
  ghostNode.textContent = ghost;
  return (
    Math.abs(
      first.left + first.width / 2 - (firstBefore.left + firstBefore.width / 2),
    ) > 3 ||
    Math.abs(first.top - firstBefore.top) > 2 ||
    Math.abs(last.top - lastBefore.top) > 2
  );
}

/**
 * Write the typed copy and the suggestion into the layer's two nodes.
 * @param {Node} typedNode
 * @param {Node} ghostNode
 * @param {string} typed
 * @param {string} ghost
 */
export function paintGhost(typedNode, ghostNode, typed, ghost) {
  if (typedNode.textContent !== typed) typedNode.textContent = typed;
  if (ghostNode.textContent !== ghost) ghostNode.textContent = ghost;
}
