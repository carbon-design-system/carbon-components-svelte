// @ts-check
// Anchors that are not elements: a pointer, a text range, a caret in a field.
// Each one answers `getBoundingClientRect()`, so it goes anywhere an element
// does (`FloatingPortal`'s `anchor`, `autoUpdate`, `computePosition`).

/**
 * @typedef {import("./auto-update.js").VirtualAnchor} VirtualAnchor
 */

/**
 * @param {number} left
 * @param {number} top
 * @param {number} [width]
 * @param {number} [height]
 */
function rect(left, top, width = 0, height = 0) {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON() {},
  };
}

/**
 * An anchor at a point, in window coordinates, such as a context menu's
 * pointer. Moves with `move(x, y)`.
 *
 * @param {number} x
 * @param {number} y
 * @returns {VirtualAnchor & { move: (x: number, y: number) => void }}
 */
export function pointAnchor(x, y) {
  const point = { x, y };
  return {
    getBoundingClientRect: () => rect(point.x, point.y),
    move(nextX, nextY) {
      point.x = nextX;
      point.y = nextY;
    },
  };
}

/**
 * An anchor on a text range, such as a selection or a word. It reads the
 * range's rect each time, so it follows text that reflows. A range with no
 * box of its own (collapsed, in some browsers) falls back to its first line
 * box.
 *
 * @param {Range} range
 * @param {Element | null} [contextElement] The scrolling box the text is in.
 * @returns {VirtualAnchor}
 */
export function rangeAnchor(range, contextElement = null) {
  return {
    contextElement:
      contextElement ??
      (range.commonAncestorContainer instanceof Element
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement),
    getBoundingClientRect() {
      const box = range.getBoundingClientRect();
      if (box.width > 0 || box.height > 0) return box;
      const first = range.getClientRects()[0];
      return first ?? box;
    },
  };
}

// The properties that decide where a character falls in a field.
const MIRRORED = [
  "direction",
  // A field resolves its text's direction by its first strong character,
  // so a line of Latin in an RTL page reads left to right.
  "unicodeBidi",
  "boxSizing",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontSizeAdjust",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
  "whiteSpace",
  "wordBreak",
  "overflowWrap",
];

/**
 * An anchor on the caret, or any character index, of an `<input>` or a
 * `<textarea>`. A field gives no geometry for its text, so this lays the same
 * text out in a hidden copy that shares the field's text styles, and reads
 * where a marker at `index` falls. The copy exists from the first read until
 * `destroy()`; reads in between cost one text write and one layout read.
 *
 * `index` defaults to the caret. The rect is one character wide at the
 * caret's line, in window coordinates, minus the field's own scroll. It
 * has to be read while the field is attached, and no copy is made without a
 * `document` (server rendering).
 *
 * @param {HTMLInputElement | HTMLTextAreaElement} field
 * @param {() => number} [getIndex]
 * @returns {VirtualAnchor & { destroy: () => void }}
 */
export function caretAnchor(field, getIndex = () => field.selectionStart ?? 0) {
  /** @type {HTMLDivElement | null} */
  let mirror = null;

  return {
    contextElement: field,
    getBoundingClientRect() {
      if (typeof document === "undefined") return rect(0, 0);
      const box = field.getBoundingClientRect();
      const style = getComputedStyle(field);
      const multiline = field.nodeName === "TEXTAREA";
      if (!mirror) {
        mirror = document.createElement("div");
        mirror.setAttribute("aria-hidden", "true");
        document.body.appendChild(mirror);
      }
      const text = mirror.style;
      for (const name of MIRRORED) {
        // @ts-expect-error indexing a style declaration by name
        text[name] = style[name];
      }
      // Fixed, so the copy never adds to the page's scroll width: off the
      // start edge of an RTL page, an absolute box would.
      text.position = "fixed";
      text.visibility = "hidden";
      text.pointerEvents = "none";
      text.top = "0";
      text.left = "0";
      text.overflow = "hidden";
      text.height = "auto";
      // The scrollbar takes room the text wraps around, so size the copy to
      // what the text has.
      text.width = `${field.clientWidth + Number.parseFloat(style.borderLeftWidth) + Number.parseFloat(style.borderRightWidth)}px`;
      text.whiteSpace = multiline ? "pre-wrap" : "pre";
      text.wordWrap = multiline ? "break-word" : "normal";

      const index = Math.max(0, Math.min(getIndex(), field.value.length));
      mirror.textContent = field.value.slice(0, index);
      const marker = document.createElement("span");
      // The rest of the line, so a word that wraps takes its start with it.
      marker.textContent = field.value.slice(index) || ".";
      mirror.appendChild(marker);

      const borderTop = Number.parseFloat(style.borderTopWidth);
      const borderLeft = Number.parseFloat(style.borderLeftWidth);
      const lineHeight =
        Number.parseFloat(style.lineHeight) ||
        Number.parseFloat(style.fontSize) * 1.2;
      const left = marker.offsetLeft + borderLeft - field.scrollLeft;
      let top =
        marker.offsetTop + borderTop - (multiline ? field.scrollTop : 0);
      // An input centers its one line in its box.
      if (!multiline) top += (field.clientHeight - mirror.clientHeight) / 2;
      return rect(box.left + left, box.top + top, 1, lineHeight);
    },
    destroy() {
      mirror?.remove();
      mirror = null;
    },
  };
}
