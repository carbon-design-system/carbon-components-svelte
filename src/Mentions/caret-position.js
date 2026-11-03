// @ts-check
// The position of a character inside a <textarea> or <input>, which the DOM
// does not expose. A hidden "mirror" element takes the field's text styles
// and the text up to the character; a marker span after that text sits
// where the character would. The technique is `textarea-caret-position`'s.
//
// A mirror is built only while a mention is open, reused for each keystroke
// (one text write and one layout read), and removed when it closes.

/**
 * Where a character sits, in CSS pixels from the field's border box.
 * `top` and `left` are not corrected for the field's own scroll.
 * @typedef {Object} CaretCoordinates
 * @property {number} top
 * @property {number} left
 * @property {number} height Line height at the caret.
 */

/** The properties that decide where text wraps and how tall it is. */
const MIRRORED = /** @type {const} */ ([
  "direction",
  "boxSizing",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderTopStyle",
  "borderRightStyle",
  "borderBottomStyle",
  "borderLeftStyle",
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
  "fontKerning",
  "fontFeatureSettings",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
  "wordBreak",
  "overflowWrap",
  "hyphens",
  "writingMode",
]);

/** @type {WeakMap<HTMLElement, HTMLDivElement>} */
const mirrors = new WeakMap();

/**
 * @param {HTMLTextAreaElement | HTMLInputElement} field
 * @param {number} position Index into `field.value`.
 * @returns {CaretCoordinates | null} `null` outside a browser.
 */
export function getCaretCoordinates(field, position) {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return null;
  }

  const computed = window.getComputedStyle(field);
  const single = field.nodeName === "INPUT";

  let mirror = mirrors.get(field);
  if (!mirror) {
    mirror = document.createElement("div");
    mirror.setAttribute("aria-hidden", "true");
    document.body.appendChild(mirror);
    mirrors.set(field, mirror);
  }

  const style = mirror.style;
  for (const property of MIRRORED) {
    style[property] = computed[property];
  }
  style.position = "absolute";
  style.visibility = "hidden";
  style.pointerEvents = "none";
  style.top = "0";
  style.left = "0";
  style.overflow = "hidden";
  style.height = "auto";
  style.boxSizing = "border-box";
  // `clientWidth` leaves out the field's scrollbar, so text wraps where it
  // wraps in the field.
  const borders =
    (Number.parseFloat(computed.borderLeftWidth) || 0) +
    (Number.parseFloat(computed.borderRightWidth) || 0);
  style.width = single ? "auto" : `${field.clientWidth + borders}px`;
  style.whiteSpace = single ? "pre" : "pre-wrap";
  style.overflowWrap = single ? "normal" : "break-word";

  const before = field.value.slice(0, position);
  // A trailing space collapses in an `input`'s mirror; a no-break space holds it.
  mirror.textContent = single ? before.replace(/\s/g, "\u00a0") : before;

  const marker = document.createElement("span");
  // The text after the caret goes in the marker: whether the word that holds
  // the caret wraps depends on the rest of it.
  marker.textContent = field.value.slice(position) || ".";
  mirror.appendChild(marker);

  const fontSize = Number.parseFloat(computed.fontSize) || 16;
  const lineHeight = Number.parseFloat(computed.lineHeight);
  const height = Number.isFinite(lineHeight)
    ? lineHeight
    : Math.round(fontSize * 1.2);
  const borderTop = Number.parseFloat(computed.borderTopWidth) || 0;

  // An `input` centers its one line in the box; the mirror, a block, starts
  // it at the top.
  let top = marker.offsetTop + borderTop;
  if (single) {
    const paddingTop = Number.parseFloat(computed.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(computed.paddingBottom) || 0;
    const room = field.clientHeight - paddingTop - paddingBottom - height;
    top = borderTop + paddingTop + Math.max(0, room / 2);
  }

  return {
    top,
    left:
      marker.offsetLeft + (Number.parseFloat(computed.borderLeftWidth) || 0),
    height,
  };
}

/**
 * Remove the mirror built for `field`.
 * @param {HTMLTextAreaElement | HTMLInputElement} field
 */
export function disposeCaretMirror(field) {
  const mirror = mirrors.get(field);
  if (!mirror) return;
  mirror.remove();
  mirrors.delete(field);
}
