// @ts-check
// A layer of text drawn behind or over a native `<input>` or `<textarea>`,
// lined up with the field's own text. The field stays the source of truth:
// its caret, selection, IME, spell check, undo and form value are the
// browser's, and the layer only adds what a field cannot draw (a fill, a
// rule, a color, a ghost suggestion). The same layer, hidden, is the
// measuring instrument for `caretRect` and `rangeRects`.
//
// What it takes to line up, learned five times over (TokenSearch,
// InlineSuggest, FormulaInput, Mentions, TextAnnotations):
//
// - One list of text properties is copied from the field's computed style,
//   and the box is measured, not copied: an input scrolls its text inside
//   fixed padding (the layer is its content box), a textarea scrolls its
//   padding with its text (the layer is its padding box minus the scrollbar).
// - The offset of the text is a transform. A textarea's is its scroll. An
//   input's is `inputTextOffset`, the two bidi rules in `input-bidi.js`.
// - No event says an input's `scrollLeft` changed in every browser, so while
//   the field has focus and was touched a moment ago it is read once a frame
//   and written when it changed.
// - A resize of the field, of its container or of a font re-measures.

import { createFrameJob } from "./frame-batch.js";
import { inputTextOffset, paragraphIsRtl, startsRtl } from "./input-bidi.js";
import { GHOST, renderSegments } from "./render-segments.js";
import { observeResize } from "./shared-observer.js";

/** @typedef {import("./render-segments.js").InputLayerSegment} InputLayerSegment */

/**
 * @typedef {Object} TextRect
 * @property {number} left
 * @property {number} top
 * @property {number} right
 * @property {number} bottom
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} InputLayerOptions
 * @property {"behind" | "above"} [position="behind"] Behind the field's text
 * (the field's fill moves to the layer, and its text stays the field's) or
 * above it (the layer ignores the pointer).
 * @property {"field" | "layer"} [ink="field"] Which text is seen. With
 * `"layer"` the field's own glyphs are made transparent, the layer draws them
 * in color above the field, and forced colors give the glyphs back to the
 * field. Sets `position` to `"above"`.
 * @property {(value: string) => ReadonlyArray<InputLayerSegment>} [segments]
 * Cuts the value into runs. Called on every `input` and by `update()`. By
 * default the layer holds the value as one run.
 * @property {string} [className] Classes for the layer's root.
 * @property {HTMLElement} [container] Where the layer is added, as the last
 * child. Defaults to the field's parent, which must be positioned.
 */

/**
 * @typedef {Object} InputLayer
 * @property {HTMLElement} element The layer's root.
 * @property {HTMLElement} content The element that holds the runs.
 * @property {(segments: ReadonlyArray<InputLayerSegment>) => void} render
 * Draw runs, as text nodes only.
 * @property {(segments?: InputLayerOptions["segments"]) => void} update Draw
 * the field's value again, with new `segments` if given.
 * @property {() => void} sync Measure and place the layer now.
 * @property {(index: number) => TextRect | null} caretRect
 * @property {(start: number, end: number) => TextRect[]} rangeRects
 * @property {() => boolean} ghostShifts Whether the `ghost` segments move the
 * value's own text.
 * @property {() => void} destroy
 */

/**
 * Text properties that move a glyph or a line break. The box (padding, border,
 * width) is measured, not copied.
 */
const MIRRORED = /** @type {const} */ ([
  "direction",
  "writingMode",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "fontStretch",
  "fontKerning",
  "fontFeatureSettings",
  "fontVariationSettings",
  "fontOpticalSizing",
  "fontSizeAdjust",
  "fontVariantLigatures",
  "fontVariantNumeric",
  "fontVariantCaps",
  "fontVariantEastAsian",
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
  "lineBreak",
]);

/** How long, after the last touch, the layer keeps reading `scrollLeft`. */
const ACTIVE_MS = 1000;

/** A scrollbar is wider than this; less is a rounding error. */
const SCROLLBAR_MIN = 4;

/** @type {WeakMap<Element, InputLayer>} */
const layers = new WeakMap();

/** @type {WeakMap<Element, Core>} */
const mirrors = new WeakMap();

/**
 * @typedef {{ observer: MutationObserver, callbacks: Set<() => void> }} DirectionWatch
 * @type {WeakMap<Document, DirectionWatch>}
 */
const directionWatches = new WeakMap();

/**
 * Call `callback` when a `dir` attribute changes anywhere in the document: a
 * field's direction is its ancestors', and nothing else reports a change in
 * one. One observer serves every layer of a document.
 * @param {Document} doc
 * @param {() => void} callback
 * @returns {() => void}
 */
function watchDirection(doc, callback) {
  if (typeof MutationObserver !== "function") return () => {};
  let watch = directionWatches.get(doc);
  if (!watch) {
    /** @type {Set<() => void>} */
    const callbacks = new Set();
    const observer = new MutationObserver(() => {
      for (const fn of callbacks) fn();
    });
    observer.observe(doc.documentElement, {
      attributes: true,
      attributeFilter: ["dir"],
      subtree: true,
    });
    watch = { observer, callbacks };
    directionWatches.set(doc, watch);
  }
  const current = watch;
  current.callbacks.add(callback);
  return () => {
    current.callbacks.delete(callback);
    if (current.callbacks.size === 0) {
      current.observer.disconnect();
      directionWatches.delete(doc);
    }
  };
}

/** @param {string} value */
const px = (value) => Number.parseFloat(value) || 0;

/**
 * Properties whose computed value, written as a string, loses digits: six
 * significant ones. `line-height: 1.42857` at 14px is 19.99998px, which the
 * string says is `20px`, and the half-leading of a line that is 20px high is
 * a pixel more than that of one that is not. Chromium then sets a textarea's
 * first line a pixel above the layer's. The typed value has them all.
 */
const EXACT = /** @type {const} */ ({
  lineHeight: "line-height",
});

/**
 * @param {Element} field
 * @param {CSSStyleDeclaration} style
 * @returns {string[]} The values of `MIRRORED`.
 */
function mirroredValues(field, style) {
  const map = /** @type {any} */ (field).computedStyleMap?.();
  return MIRRORED.map((name) => {
    const property = /** @type {Record<string, string>} */ (EXACT)[name];
    const value = property ? map?.get(property) : undefined;
    if (value && typeof value.value === "number") {
      return value.unit === "number"
        ? `${value.value}`
        : `${value.value}${value.unit}`;
    }
    return style[name];
  });
}

/**
 * @typedef {Object} Core
 * @property {HTMLElement} root
 * @property {HTMLElement} content
 * @property {boolean} multiline
 * @property {(segments: ReadonlyArray<InputLayerSegment>) => void} render
 * @property {() => void} syncNow Measure, write and place, now.
 * @property {() => boolean} unmeasured Whether the text must be measured again.
 * @property {() => Snapshot} read
 * @property {(snapshot: Snapshot) => void} write
 * @property {() => void} applyScroll Place the text for the field's scroll.
 * @property {() => boolean} scrolled Whether the field's scroll differs from
 * the last placement.
 * @property {() => void} markText The text changed: measure it again.
 * @property {(index: number) => TextRect | null} caretRect
 * @property {(start: number, end: number) => TextRect[]} rangeRects
 * @property {() => boolean} ghostShifts
 * @property {() => void} dispose
 */

/**
 * @typedef {Object} Snapshot
 * @property {string[]} styles Values of `MIRRORED`.
 * @property {number} left Root box, from the containing block's padding box.
 * @property {number} top
 * @property {number} width
 * @property {number} height
 * @property {number} boxLeft Text box, from the root.
 * @property {number} boxTop
 * @property {number} boxWidth
 * @property {number} boxHeight
 * @property {string} padding
 * @property {string} dir
 * @property {string} whiteSpace
 * @property {string} textAlign
 * @property {string} bidi
 * @property {boolean} fieldRtl
 * @property {number} textWidth
 * @property {boolean} textRtl
 * @property {number} scrollLeft
 * @property {number} scrollTop
 */

/**
 * The viewport position of the padding box of `parent`, which is the origin
 * of an absolutely positioned child. Without a positioned ancestor the origin
 * is the page.
 * @param {Element | null} parent
 * @param {Window} view
 * @returns {{ x: number, y: number }}
 */
function originOf(parent, view) {
  const doc = view.document;
  if (
    !parent ||
    (parent === doc.body && view.getComputedStyle(parent).position === "static")
  ) {
    return { x: -view.scrollX, y: -view.scrollY };
  }
  const rect = parent.getBoundingClientRect();
  return {
    x: rect.left + parent.clientLeft - parent.scrollLeft,
    y: rect.top + parent.clientTop - parent.scrollTop,
  };
}

/**
 * The text nodes of `root` in order, with where each starts, up to `limit`
 * characters.
 * @param {Element} root
 * @param {number} limit
 * @returns {Array<{ node: Text, start: number }>}
 */
function textNodes(root, limit) {
  const walker = root.ownerDocument.createTreeWalker(root, 4);
  /** @type {Array<{ node: Text, start: number }>} */
  const nodes = [];
  let start = 0;
  for (
    let node = /** @type {Text | null} */ (walker.nextNode());
    node && start < limit;
    node = /** @type {Text | null} */ (walker.nextNode())
  ) {
    if (node.data.length === 0) continue;
    nodes.push({ node, start });
    start += node.data.length;
  }
  return nodes;
}

/**
 * Where the characters `start` to `end` of the text in `content` are drawn,
 * one box for each run of a line. A box of zero width at a character is its
 * leading edge.
 * @param {HTMLElement} content
 * @param {number} length The characters that are the field's value.
 * @param {number} start
 * @param {number} end
 * @param {boolean} [keepEmpty] Keep a box with a height and no width, which is
 * what a newline has.
 * @returns {TextRect[]}
 */
function rectsOf(content, length, start, end, keepEmpty = false) {
  const doc = content.ownerDocument;
  const from = Math.max(0, Math.min(start, length));
  const to = Math.max(from, Math.min(end, length));
  /** @type {TextRect[]} */
  const rects = [];
  const range = doc.createRange();
  // jsdom has no layout, and no ranges that measure.
  if (typeof range.getClientRects !== "function") return rects;
  for (const { node, start: at } of textNodes(content, to)) {
    const a = Math.max(from - at, 0);
    const b = Math.min(to - at, node.data.length);
    if (b <= a) continue;
    range.setStart(node, a);
    range.setEnd(node, b);
    for (const r of range.getClientRects()) {
      if ((keepEmpty || r.width > 0) && r.height > 0) rects.push(toRect(r));
    }
  }
  return mergeLines(rects);
}

/** @param {DOMRect} r @returns {TextRect} */
function toRect(r) {
  return {
    left: r.left,
    top: r.top,
    right: r.right,
    bottom: r.bottom,
    width: r.width,
    height: r.height,
  };
}

/**
 * Runs that touch on one line are one box.
 * @param {TextRect[]} rects
 * @returns {TextRect[]}
 */
function mergeLines(rects) {
  /** @type {TextRect[]} */
  const lines = [];
  for (const r of rects) {
    const last = lines[lines.length - 1];
    if (
      last &&
      Math.abs(last.top - r.top) < 2 &&
      Math.abs(last.bottom - r.bottom) < 2 &&
      r.left <= last.right + 1 &&
      r.right >= last.left - 1
    ) {
      last.left = Math.min(last.left, r.left);
      last.right = Math.max(last.right, r.right);
      last.width = last.right - last.left;
      continue;
    }
    lines.push({ ...r });
  }
  return lines;
}

/**
 * The caret before character `index`: the leading edge of that character, or
 * the trailing edge of the last one at the end of the text. Leading means the
 * right edge of a right to left character.
 * @param {HTMLElement} content
 * @param {string} text
 * @param {number} index
 * @returns {TextRect | null}
 */
function caretOf(content, text, index) {
  const at = Math.max(0, Math.min(index, text.length));
  const atEnd = at >= text.length;
  // The layer ends in a zero width character after an empty text or a final
  // newline, so that there is a line to put the caret on.
  if (text === "" || (atEnd && text.endsWith("\n"))) {
    const nodes = textNodes(content, Number.POSITIVE_INFINITY);
    const node = nodes[nodes.length - 1]?.node;
    const range = content.ownerDocument.createRange();
    if (!node || typeof range.getClientRects !== "function") return null;
    range.setStart(node, 0);
    range.setEnd(node, node.data.length);
    const [r] = range.getClientRects();
    return r ? { ...toRect(r), right: r.left, width: 0 } : null;
  }
  // A surrogate pair is one character.
  const from = atEnd ? text.length - 1 : at;
  const size = (text.codePointAt(from) ?? 0) > 0xffff ? 2 : 1;
  const [rect] = rectsOf(content, text.length, from, from + size, true);
  if (!rect) return null;
  const rtl = startsRtl(text.slice(from, from + size));
  const x = atEnd === rtl ? rect.left : rect.right;
  return {
    left: x,
    right: x,
    top: rect.top,
    bottom: rect.bottom,
    width: 0,
    height: rect.height,
  };
}

/**
 * @param {HTMLInputElement | HTMLTextAreaElement} field
 * @param {{ position: "behind" | "above", ink?: boolean, visible: boolean, className?: string, container?: HTMLElement }} config
 * @returns {Core | null}
 */
function buildCore(field, config) {
  const doc = field.ownerDocument;
  const container = config.container ?? field.parentElement;
  const found = doc.defaultView;
  if (!found || !container) return null;
  // A function declaration below does not see the narrowing.
  const view = /** @type {Window} */ (found);
  const multiline = field.localName === "textarea";

  const root = doc.createElement("div");
  root.className = `bx--input-layer bx--input-layer--${
    config.visible ? config.position : "measure"
  } bx--input-layer--${multiline ? "block" : "line"}`;
  if (config.ink) root.className += " bx--input-layer--ink";
  if (config.className) root.className += ` ${config.className}`;
  root.setAttribute("aria-hidden", "true");
  const box = doc.createElement("div");
  box.className = "bx--input-layer__box";
  const content = doc.createElement("div");
  content.className = "bx--input-layer__content";
  box.appendChild(content);
  root.appendChild(box);
  container.appendChild(root);

  /** @type {string[]} */
  let lastStyles = [];
  const last = {
    left: "",
    top: "",
    width: "",
    height: "",
    boxLeft: "",
    contentLeft: "",
    boxTop: "",
    boxWidth: "",
    boxHeight: "",
    padding: "",
    dir: "",
    whiteSpace: "",
    bidi: "",
    transform: "",
  };
  let drawn = "";
  let textWidth = 0;
  let textRtl = false;
  let textDirty = true;
  let boxWidth = 0;
  let fieldRtl = false;
  let textAlign = "start";
  let placedLeft = Number.NaN;
  let placedTop = Number.NaN;

  /**
   * Set a style once per change.
   * @param {HTMLElement} el
   * @param {keyof typeof last} key
   * @param {string} name
   * @param {string} value
   */
  function set(el, key, name, value) {
    if (last[key] === value) return;
    last[key] = value;
    /** @type {Record<string, string>} */ (/** @type {unknown} */ (el.style))[
      name
    ] = value;
  }

  /** @param {Snapshot} s */
  function write(s) {
    const boxStyle = /** @type {Record<string, string>} */ (
      /** @type {unknown} */ (box.style)
    );
    for (let i = 0; i < MIRRORED.length; i++) {
      const value = s.styles[i];
      if (value != null && value !== lastStyles[i])
        boxStyle[MIRRORED[i]] = value;
    }
    lastStyles = s.styles;

    set(root, "left", "left", `${s.left}px`);
    set(root, "top", "top", `${s.top}px`);
    set(root, "width", "width", `${s.width}px`);
    set(root, "height", "height", `${s.height}px`);
    set(box, "boxLeft", "left", `${s.boxLeft}px`);
    set(box, "boxTop", "top", `${s.boxTop}px`);
    set(box, "boxWidth", "width", `${s.boxWidth}px`);
    set(box, "boxHeight", "height", `${s.boxHeight}px`);
    set(box, "padding", "padding", s.padding);
    // The paragraph's direction is the field's, or its first strong
    // character's when the field says `dir="auto"`.
    if (last.dir !== s.dir) {
      if (last.dir !== "") textDirty = true;
      last.dir = s.dir;
      if (s.dir) box.setAttribute("dir", s.dir);
      else box.removeAttribute("dir");
    }
    set(content, "bidi", "unicodeBidi", s.bidi);
    if (multiline) set(content, "whiteSpace", "whiteSpace", s.whiteSpace);
    boxWidth = s.boxWidth;
    fieldRtl = s.fieldRtl;
    textAlign = s.textAlign;
    textWidth = s.textWidth;
    textRtl = s.textRtl;
    place(s.scrollLeft, s.scrollTop);
  }

  /**
   * @param {number} scrollLeft
   * @param {number} scrollTop
   */
  function place(scrollLeft, scrollTop) {
    placedLeft = scrollLeft;
    placedTop = scrollTop;
    if (!multiline) {
      // `left`, not a transform: Firefox rounds the vertical position of a
      // line of text under a transform the other way from its own input's,
      // and so draws the layer a pixel low.
      set(
        content,
        "contentLeft",
        "left",
        `${inputTextOffset({
          boxWidth,
          textWidth,
          scrollLeft,
          fieldRtl,
          textRtl,
          textAlign,
        })}px`,
      );
      return;
    }
    const x = -scrollLeft;
    const y = -scrollTop;
    const transform = x || y ? `translate(${x}px, ${y}px)` : "";
    if (transform !== last.transform) {
      last.transform = transform;
      content.style.transform = transform;
    }
  }

  /** @returns {Snapshot} */
  function read() {
    const style = view.getComputedStyle(field);
    const fr = field.getBoundingClientRect();
    const origin = originOf(root.offsetParent, view);
    const bL = px(style.borderLeftWidth);
    const bR = px(style.borderRightWidth);
    const bT = px(style.borderTopWidth);
    const bB = px(style.borderBottomWidth);
    const pL = px(style.paddingLeft);
    const pR = px(style.paddingRight);
    const pT = px(style.paddingTop);
    const pB = px(style.paddingBottom);
    const width = fr.width - bL - bR;
    const height = fr.height - bT - bB;

    /** @type {Pick<Snapshot, "boxLeft" | "boxTop" | "boxWidth" | "boxHeight" | "padding">} */
    let inner;
    if (multiline) {
      // The scrollbars sit inside the padding box, and the text wraps in
      // what they leave. `clientWidth` is rounded, so a gap that small is
      // rounding and not a scrollbar.
      const barX = field.offsetWidth - field.clientWidth - bL - bR;
      const barY = field.offsetHeight - field.clientHeight - bT - bB;
      const trackX = barX >= SCROLLBAR_MIN ? barX : 0;
      const trackY = barY >= SCROLLBAR_MIN ? barY : 0;
      const startX = field.clientLeft - bL;
      inner = {
        boxLeft: trackX > 0 && startX >= SCROLLBAR_MIN ? trackX : 0,
        boxTop: 0,
        boxWidth: width - trackX,
        boxHeight: height - trackY,
        padding: `${pT}px ${pR}px ${pB}px ${pL}px`,
      };
    } else {
      inner = {
        boxLeft: pL,
        boxTop: pT,
        boxWidth: Math.max(0, width - pL - pR),
        boxHeight: Math.max(0, height - pT - pB),
        padding: "0px",
      };
    }

    let measuredWidth = textWidth;
    let measuredRtl = textRtl;
    if (textDirty) {
      // Only a line of an input is placed from its width.
      if (!multiline) {
        measuredWidth = content.getBoundingClientRect().width;
        measuredRtl = paragraphIsRtl(
          drawn,
          style.direction === "rtl",
          style.unicodeBidi === "plaintext" ||
            field.getAttribute("dir") === "auto",
        );
      }
      textDirty = false;
    }

    return {
      styles: mirroredValues(field, style),
      left: fr.left + bL - origin.x,
      top: fr.top + bT - origin.y,
      width,
      height,
      ...inner,
      dir: field.getAttribute("dir") ?? "",
      whiteSpace: style.whiteSpace,
      textAlign: style.textAlign,
      bidi: style.unicodeBidi,
      fieldRtl: style.direction === "rtl",
      textWidth: measuredWidth,
      textRtl: measuredRtl,
      scrollLeft: field.scrollLeft,
      scrollTop: field.scrollTop,
    };
  }

  return {
    root,
    content,
    multiline,
    render(segments) {
      drawn = renderSegments(content, segments, { trailingBreak: true });
      textDirty = true;
    },
    syncNow() {
      if (!field.isConnected) return;
      textDirty = true;
      write(read());
      // A change of direction changes the text's width.
      if (textDirty) write(read());
    },
    unmeasured() {
      return textDirty;
    },
    read,
    write,
    applyScroll() {
      place(field.scrollLeft, field.scrollTop);
    },
    scrolled() {
      return field.scrollLeft !== placedLeft || field.scrollTop !== placedTop;
    },
    markText() {
      textDirty = true;
    },
    caretRect(index) {
      return caretOf(content, drawn, index);
    },
    rangeRects(start, end) {
      return rectsOf(content, drawn.length, start, end);
    },
    ghostShifts() {
      const ghosts = /** @type {HTMLElement[]} */ ([
        ...content.getElementsByClassName(GHOST),
      ]);
      const length = drawn.length;
      if (ghosts.length === 0 || length === 0) return false;
      /** The first and last character of the value, and where they are. */
      const sample = () => {
        const first = rectsOf(content, length, 0, 1)[0];
        const last = rectsOf(content, length, length - 1, length)[0];
        return first && last ? { first, last } : null;
      };
      const withGhost = sample();
      for (const ghost of ghosts) ghost.style.display = "none";
      // Without the ghost the line is as wide as the value, and an input
      // puts it where the field does.
      const before = content.style.left;
      if (!multiline) {
        const width = content.getBoundingClientRect().width;
        content.style.left = `${inputTextOffset({
          boxWidth,
          textWidth: width,
          scrollLeft: placedLeft,
          fieldRtl,
          textRtl,
          textAlign,
        })}px`;
      }
      const without = sample();
      for (const ghost of ghosts) ghost.style.display = "";
      content.style.left = before;
      if (!withGhost || !without) return false;
      // The first character shows a sideways move and the last a change of
      // line. Joined scripts reshape the last letters when more text
      // follows, so widths are not compared.
      const mid = (/** @type {TextRect} */ r) => r.left + r.width / 2;
      return (
        Math.abs(mid(withGhost.first) - mid(without.first)) > 3 ||
        Math.abs(withGhost.first.top - without.first.top) > 2 ||
        Math.abs(withGhost.last.top - without.last.top) > 2
      );
    },
    dispose() {
      root.remove();
    },
  };
}

/**
 * Add a layer of text behind or over `field`, lined up with the field's own
 * text. The layer is `aria-hidden` and ignores the pointer. Call `destroy()`
 * to remove it and give the field back.
 *
 * @param {HTMLInputElement | HTMLTextAreaElement} field
 * @param {InputLayerOptions} [options]
 * @returns {InputLayer}
 * @example
 * ```js
 * const layer = createInputLayer(input, {
 *   segments: (value) => [{ text: value, className: "my-run" }],
 * });
 * ```
 */
export function createInputLayer(field, options = {}) {
  layers.get(field)?.destroy();
  const ink = options.ink ?? "field";
  const position = ink === "layer" ? "above" : (options.position ?? "behind");
  const built = buildCore(field, {
    position,
    ink: ink === "layer",
    visible: true,
    className: options.className,
    container: options.container,
  });

  /** @type {InputLayer} */
  const inert = {
    element: /** @type {HTMLElement} */ (/** @type {unknown} */ (null)),
    content: /** @type {HTMLElement} */ (/** @type {unknown} */ (null)),
    render() {},
    update() {},
    sync() {},
    ghostShifts: () => false,
    caretRect: () => null,
    rangeRects: () => [],
    destroy() {},
  };
  if (!built) return inert;
  const core = built;

  const doc = field.ownerDocument;
  const host = core.root.parentElement;
  const hostClass = "bx--input-layer-host";
  const addedHost = !!host && !host.classList.contains(hostClass);
  if (host && position === "behind") host.classList.add(hostClass);

  let segments = options.segments;
  let destroyed = false;
  let focused = doc.activeElement === field;
  let activeUntil = 0;
  let frame = 0;
  let value = "";
  /** @type {number} */
  let left = Number.NaN;
  let top = Number.NaN;

  const job = createFrameJob([
    () => (destroyed ? undefined : core.read()),
    (/** @type {Snapshot | undefined} */ snapshot) => {
      if (!snapshot || destroyed) return;
      core.write(snapshot);
      left = field.offsetLeft;
      top = field.offsetTop;
      if (core.unmeasured()) job.schedule();
    },
  ]);

  function draw() {
    value = field.value;
    core.render(
      segments ? segments(value) : value === "" ? [] : [{ text: value }],
    );
  }

  /** Read `scrollLeft` and `scrollTop` and move the text if they changed. */
  function follow() {
    if (destroyed) return;
    if (core.scrolled()) core.applyScroll();
  }

  function poll() {
    frame = 0;
    if (destroyed || !focused) return;
    if (field.value !== value) {
      draw();
      job.schedule();
    }
    follow();
    if (field.offsetLeft !== left || field.offsetTop !== top) job.schedule();
    if (performance.now() < activeUntil) frame = requestAnimationFrame(poll);
  }

  // Keep reading the scroll for a while after the field was touched: no
  // event says `scrollLeft` changed in every browser.
  function touch() {
    activeUntil = performance.now() + ACTIVE_MS;
    if (!frame && focused) frame = requestAnimationFrame(poll);
  }

  function handleInput() {
    draw();
    job.schedule();
    touch();
  }

  function handleScroll() {
    follow();
    touch();
  }

  function handleFocus() {
    focused = true;
    job.schedule();
    touch();
  }

  function handleBlur() {
    focused = false;
    follow();
    // The field puts its scroll back as it loses focus.
    requestAnimationFrame(follow);
  }

  function handleSelectionChange() {
    if (doc.activeElement === field) handleScroll();
  }

  function handleReset() {
    requestAnimationFrame(() => {
      if (destroyed) return;
      draw();
      job.schedule();
    });
  }

  /** @type {Array<[string, EventListener]>} */
  const listeners = [
    ["input", handleInput],
    ["scroll", handleScroll],
    ["select", handleScroll],
    ["keydown", touch],
    ["keyup", handleScroll],
    ["pointerdown", touch],
    ["compositionupdate", touch],
    ["focus", handleFocus],
    ["blur", handleBlur],
  ];
  for (const [type, fn] of listeners) field.addEventListener(type, fn);
  doc.addEventListener("selectionchange", handleSelectionChange);
  const form = field.form;
  form?.addEventListener("reset", handleReset);
  const stopField = observeResize(field, () => job.schedule());
  const stopHost = host ? observeResize(host, () => job.schedule()) : () => {};
  const stopDirection = watchDirection(doc, () => {
    core.markText();
    job.schedule();
  });
  const fonts = doc.fonts;
  const handleFonts = () => job.schedule();
  fonts?.addEventListener?.("loadingdone", handleFonts);
  fonts?.ready?.then(handleFonts);

  draw();
  core.syncNow();
  field.setAttribute("data-ccs-input-layer", position);
  if (ink === "layer") field.setAttribute("data-ccs-input-layer-ink", "layer");
  left = field.offsetLeft;
  top = field.offsetTop;
  if (focused) touch();

  /** @type {InputLayer} */
  const layer = {
    element: core.root,
    content: core.content,
    render(next) {
      core.render(next);
      job.schedule();
    },
    update(next) {
      if (next) segments = next;
      draw();
      job.schedule();
    },
    sync() {
      job.cancel();
      draw();
      core.syncNow();
      left = field.offsetLeft;
      top = field.offsetTop;
    },
    ghostShifts() {
      flush();
      return core.ghostShifts();
    },
    caretRect(index) {
      flush();
      return core.caretRect(index);
    },
    rangeRects(start, end) {
      flush();
      return core.rangeRects(start, end);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      job.cancel();
      cancelAnimationFrame(frame);
      for (const [type, fn] of listeners) field.removeEventListener(type, fn);
      doc.removeEventListener("selectionchange", handleSelectionChange);
      form?.removeEventListener("reset", handleReset);
      stopField();
      stopHost();
      stopDirection();
      fonts?.removeEventListener?.("loadingdone", handleFonts);
      field.removeAttribute("data-ccs-input-layer");
      field.removeAttribute("data-ccs-input-layer-ink");
      if (addedHost) host?.classList.remove(hostClass);
      core.dispose();
      if (layers.get(field) === layer) layers.delete(field);
    },
  };

  /** Place the layer now if a placement is waiting for the next frame. */
  function flush() {
    job.cancel();
    if (field.value !== value) draw();
    core.syncNow();
  }

  layers.set(field, layer);
  return layer;
}

/**
 * Svelte action form of `createInputLayer`. Pass `value` too and the layer
 * draws again whenever the app changes it from code.
 *
 * @param {HTMLInputElement | HTMLTextAreaElement} node
 * @param {InputLayerOptions & { value?: string }} [options]
 * @returns {{ update: (options?: InputLayerOptions & { value?: string }) => void, destroy: () => void }}
 * @example
 * ```svelte
 * <input class="bx--text-input" bind:value use:inputLayer={{ segments, value }} />
 * ```
 */
export function inputLayer(node, options = {}) {
  let current = options;
  let layer = createInputLayer(node, options);
  return {
    update(next = {}) {
      const rebuild =
        (next.position ?? "behind") !== (current.position ?? "behind") ||
        (next.ink ?? "field") !== (current.ink ?? "field") ||
        next.className !== current.className ||
        next.container !== current.container;
      current = next;
      if (rebuild) {
        layer.destroy();
        layer = createInputLayer(node, next);
        return;
      }
      layer.update(next.segments);
    },
    destroy() {
      layer.destroy();
    },
  };
}

/**
 * Whether `index` can be measured: the field is in a document with layout.
 * @param {Element} field
 */
function measurable(field) {
  return (
    typeof document !== "undefined" &&
    field.isConnected &&
    (field.localName === "input" || field.localName === "textarea")
  );
}

/** @type {WeakMap<Element, number>} */
const mirrorFrames = new WeakMap();

/**
 * The layer that is on `field`, or a hidden one built to measure it. A hidden
 * layer goes two frames after the last measurement.
 * @param {HTMLInputElement | HTMLTextAreaElement} field
 * @returns {{ caretRect: Core["caretRect"], rangeRects: Core["rangeRects"] } | null}
 */
function instrument(field) {
  const layer = layers.get(field);
  if (layer) return layer;

  let core = mirrors.get(field);
  if (!core) {
    const built = buildCore(field, { position: "behind", visible: false });
    if (!built) return null;
    core = built;
    mirrors.set(field, core);
  }
  const mirror = core;
  mirror.render([{ text: field.value }]);
  mirror.syncNow();

  const view = field.ownerDocument.defaultView;
  if (view) {
    view.cancelAnimationFrame(mirrorFrames.get(field) ?? 0);
    mirrorFrames.set(
      field,
      view.requestAnimationFrame(() => {
        mirrorFrames.set(
          field,
          view.requestAnimationFrame(() => {
            mirror.dispose();
            mirrors.delete(field);
            mirrorFrames.delete(field);
          }),
        );
      }),
    );
  }
  return mirror;
}

/**
 * Where the caret sits before character `index` of a field's value, in
 * viewport coordinates, as the field is scrolled now. A box of zero width,
 * as tall as the line. Measured on the field's `createInputLayer` layer if it
 * has one, else on a hidden copy that exists for two frames. `null` where
 * there is no layout (server rendering, jsdom) or the field is not in the
 * document.
 *
 * @param {HTMLInputElement | HTMLTextAreaElement} field
 * @param {number} index An index into `field.value`.
 * @returns {TextRect | null}
 * @example
 * ```js
 * const rect = caretRect(textarea, textarea.selectionStart);
 * popup.style.insetBlockStart = `${rect.bottom}px`;
 * ```
 */
export function caretRect(field, index) {
  if (!measurable(field)) return null;
  return instrument(field)?.caretRect(index) ?? null;
}

/**
 * Where the characters `start` to `end` of a field's value are drawn, in
 * viewport coordinates: one box for each line they touch.
 *
 * @param {HTMLInputElement | HTMLTextAreaElement} field
 * @param {number} start
 * @param {number} end
 * @returns {TextRect[]}
 */
export function rangeRects(field, start, end) {
  if (!measurable(field)) return [];
  return instrument(field)?.rangeRects(start, end) ?? [];
}
