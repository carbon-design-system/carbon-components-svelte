<script>
  /**
   * @typedef {{ x: number; y: number; width: number; height: number; text: string }} LayoutInspectorMark
   * @restProps {div}
   */

  /** Set to `true` to turn the inspector on. The caller controls this; LayoutInspector never toggles its own visibility. */
  export let open = false;

  /** Set to `false` to stop drawing the margin, padding, and content boxes of the element under the pointer. */
  export let spacing = true;

  /** Set to `false` to turn off measuring. When on, hover an element, hold `measureKey`, then hover another element to see the distances between them. */
  export let measure = true;

  /**
   * Key to hold while measuring.
   * `"Alt"` is the Option (⌥) key on macOS.
   * Use `"Shift"` on keyboards without Alt or Option, or if Alt shortcuts in your app get in the way.
   * @type {"Alt" | "Shift" | "Control" | "Meta"}
   */
  export let measureKey = "Alt";

  /**
   * Where the info card goes.
   * `"cursor"` follows the pointer and flips away from viewport edges.
   * `"corner"` docks it in the bottom-right corner, moving it to the bottom-left while the pointer is near.
   * @type {"cursor" | "corner"}
   */
  export let cardPlacement = "cursor";

  /** Set to `false` to hide the Carbon type token of hovered text. */
  export let type = true;

  /**
   * Set to `false` to hide colors from the card.
   * When on, the card shows the hovered element's text, background, and border colors with their Carbon theme token names, and the WCAG contrast of its text.
   */
  export let colors = true;

  /** Set to `true` to outline all text whose contrast against its background is below WCAG AA. */
  export let contrast = false;

  /** Set to `true` to outline elements that push the page into horizontal scroll, and content clipped or truncated by `overflow: hidden`. */
  export let overflow = false;

  /** Set to `true` to outline every element whose margin, padding, or gap is not a Carbon spacing token. */
  export let lint = false;

  /**
   * Set to `true` to lint Carbon's own components too.
   * By default, `lint` skips elements with a `bx--` class and their unstyled inner elements (such as the `<input>` inside `NumberInput`), so only your layout code is checked.
   */
  export let lintCarbon = false;

  /** CSS selector for more elements for `lint` to skip, for example third-party widgets. */
  export let lintIgnore = "";

  /** Set to `true` to outline every interactive element smaller than `targetSize` in either dimension. */
  export let targets = false;

  /**
   * Minimum target size in pixels for `targets`.
   * `24` is the WCAG 2.2 AA minimum (2.5.8); `44` is the AAA size (2.5.5).
   */
  export let targetSize = 24;

  /**
   * Delay in milliseconds before the box model first appears.
   * The pointer must rest on one element this long, so sweeping across the page does not flash the overlay.
   * Once it shows, moving to another element updates it at once, like a `TooltipGroup`.
   * `0` shows it at once.
   */
  export let enterDelayMs = 150;

  /** Delay in milliseconds before the box model hides once the pointer leaves every element. */
  export let leaveDelayMs = 100;

  /** How long in milliseconds after the box model hides that it still comes back at once. */
  export let skipDelayMs = 300;

  import { tick } from "svelte";
  import {
    colorTokens,
    effectiveBackground,
    hasTokens,
    normalizeColor,
    textContrast,
    toHex,
    toRgba,
  } from "./colors.js";

  // Dev tools mark their own roots with this attribute, so hover and page
  // scans skip them (and each other).
  const DEVTOOLS = "[data-ccs-devtools]";

  // Carbon v10 spacing scale, in rem, so it tracks the root font size.
  const SPACING_REM = [0.125, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 10];

  const TYPE_TOKENS = [
    "caption-01",
    "caption-02",
    "label-01",
    "label-02",
    "helper-text-01",
    "helper-text-02",
    "body-short-01",
    "body-short-02",
    "body-long-01",
    "body-long-02",
    "code-01",
    "code-02",
    "heading-01",
    "heading-02",
    "productive-heading-01",
    "productive-heading-02",
    "productive-heading-03",
    "productive-heading-04",
    "productive-heading-05",
    "productive-heading-06",
    "productive-heading-07",
    "expressive-paragraph-01",
    "expressive-heading-01",
    "expressive-heading-02",
    "expressive-heading-03",
    "expressive-heading-04",
    "expressive-heading-05",
    "expressive-heading-06",
    "quotation-01",
    "quotation-02",
    "display-01",
    "display-02",
    "display-03",
    "display-04",
  ];

  const INTERACTIVE = [
    "a[href]",
    "button",
    "input:not([type='hidden'])",
    "select",
    "textarea",
    "summary",
    "[role='button']",
    "[role='link']",
    "[role='checkbox']",
    "[role='radio']",
    "[role='switch']",
    "[role='tab']",
    "[role='menuitem']",
    "[role='option']",
    "[tabindex]:not([tabindex='-1'])",
  ].join(", ");

  const FLEX_OR_GRID = /flex|grid/;

  const CARBON_ELEMENTS =
    "[class*='bx--'], [class*='bx--'] > :not([class]):not([style*=':'])";

  // Caps page-wide scans so a huge page cannot stall the inspector.
  const MAX_MARKS = 500;

  /** Root font size in px, refreshed on every measure. */
  let remPx = 16;

  /**
   * Name of the spacing token for `px`, `"0"` for zero, or `null` when the
   * value is off the scale. Negative values match by magnitude.
   * @param {number} px
   */
  function spacingToken(px) {
    const abs = Math.abs(px);
    if (abs < 0.5) return "0";
    const index = SPACING_REM.findIndex(
      (rem) => Math.abs(rem * remPx - abs) < 0.5,
    );
    return index === -1
      ? null
      : `spacing-${String(index + 1).padStart(2, "0")}`;
  }

  /** @param {number} px */
  function fmt(px) {
    return String(Math.round(px * 10) / 10);
  }

  /**
   * @param {CSSStyleDeclaration} style
   * @param {"margin" | "padding" | "border"} prop
   * @returns {[number, number, number, number]} top, right, bottom, left
   */
  function sides(style, prop) {
    const suffix = prop === "border" ? "Width" : "";
    return /** @type {[number, number, number, number]} */ (
      ["Top", "Right", "Bottom", "Left"].map(
        (side) => Number.parseFloat(style[`${prop}${side}${suffix}`]) || 0,
      )
    );
  }

  /**
   * Gap of a flex or grid container, or `null` for anything else.
   * @param {CSSStyleDeclaration} style
   */
  function gaps(style) {
    if (!FLEX_OR_GRID.test(style.display)) return null;
    const row = Number.parseFloat(style.rowGap) || 0;
    const column = Number.parseFloat(style.columnGap) || 0;
    return row || column ? { row, column } : null;
  }

  /**
   * Type token table, measured from the library's own `bx--type-*` classes
   * at the current viewport, so fluid and responsive tokens match too.
   * @type {{ name: string; size: number; lineHeight: number; weight: string; letterSpacing: number; family: string }[] | null}
   */
  let typeTable = null;

  function buildTypeTable() {
    const box = document.createElement("div");
    box.style.cssText =
      "position:absolute;visibility:hidden;pointer-events:none";
    for (const name of TYPE_TOKENS) {
      const probe = document.createElement("span");
      probe.className = `bx--type-${name}`;
      probe.textContent = "x";
      box.append(probe);
    }
    document.body.append(box);
    typeTable = [...box.children].map((probe, i) => {
      const style = getComputedStyle(probe);
      return {
        name: TYPE_TOKENS[i],
        size: Number.parseFloat(style.fontSize),
        lineHeight: Number.parseFloat(style.lineHeight),
        weight: style.fontWeight,
        letterSpacing: Number.parseFloat(style.letterSpacing) || 0,
        family: style.fontFamily,
      };
    });
    box.remove();
  }

  /**
   * Type tokens whose size, line height, weight, letter spacing, and family
   * all match `style`. Aliases such as `body-short-01` and `helper-text-02`
   * can match together.
   * @param {CSSStyleDeclaration} style
   */
  function typeTokens(style) {
    if (!typeTable) buildTypeTable();
    const size = Number.parseFloat(style.fontSize);
    const lineHeight = Number.parseFloat(style.lineHeight);
    const letterSpacing = Number.parseFloat(style.letterSpacing) || 0;
    return (typeTable ?? [])
      .filter(
        (t) =>
          Math.abs(t.size - size) < 0.5 &&
          Math.abs(t.lineHeight - lineHeight) < 0.5 &&
          t.weight === style.fontWeight &&
          Math.abs(t.letterSpacing - letterSpacing) < 0.05 &&
          t.family === style.fontFamily,
      )
      .map((t) => t.name);
  }

  /** @param {Element} el */
  function hasOwnText(el) {
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()) {
        return true;
      }
    }
    return false;
  }

  /** @param {Element} el */
  function describe(el) {
    const tag = el.tagName.toLowerCase();
    const cls = [...el.classList].find((c) => !c.startsWith("svelte-"));
    return cls ? `${tag}.${cls}` : tag;
  }

  // ---------------------------------------------------------------------
  // Hover: box model, type, and measuring

  /** @type {Element | null} */
  let hovered = null;
  /** @type {Element | null} */
  let anchor = null;
  let measuring = false;

  /** Pointer position in viewport coordinates, for the cursor card. */
  let pointerX = 0;
  let pointerY = 0;

  /** @type {HTMLElement | null} */
  let cardEl = null;

  // Which side of the pointer the card sits on. Flipping has hysteresis
  // (see `placeCard`), so the card does not flip back and forth at an edge.
  let flipX = false;
  let flipY = false;
  let cornerLeft = false;

  const KEY_LABELS = {
    Alt: "Alt / ⌥",
    Shift: "Shift",
    Control: "Ctrl",
    Meta: "⌘ / Win",
  };

  const CARD_GAP = 16;
  const CARD_EDGE = 8;
  const FLIP_SLACK = 48;

  /**
   * Positions the single, reused card with a transform, without a
   * re-render. "cursor" sits below-right of the pointer and flips to the
   * other side when it would cross a viewport edge; it flips back only once
   * there is `FLIP_SLACK` more room, so it does not jitter at the edge.
   * "corner" docks bottom-right and moves bottom-left while the pointer
   * is over its spot.
   */
  function placeCard() {
    if (!cardEl) return;
    const w = cardEl.offsetWidth;
    const h = cardEl.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    let left;
    let top;

    if (cardPlacement === "corner") {
      const near = (/** @type {number} */ x) =>
        pointerX >= x - CARD_GAP &&
        pointerX <= x + w + CARD_GAP &&
        pointerY >= vh - h - CARD_EDGE - CARD_GAP;
      const rightX = vw - w - CARD_EDGE;
      if (!cornerLeft && near(rightX)) cornerLeft = true;
      else if (cornerLeft && near(CARD_EDGE)) cornerLeft = false;
      left = cornerLeft ? CARD_EDGE : rightX;
      top = vh - h - CARD_EDGE;
    } else {
      const roomRight = vw - CARD_EDGE - (pointerX + CARD_GAP + w);
      const roomBelow = vh - CARD_EDGE - (pointerY + CARD_GAP + h);
      if (!flipX && roomRight < 0) flipX = true;
      else if (flipX && roomRight > FLIP_SLACK) flipX = false;
      if (!flipY && roomBelow < 0) flipY = true;
      else if (flipY && roomBelow > FLIP_SLACK) flipY = false;
      left = flipX ? pointerX - CARD_GAP - w : pointerX + CARD_GAP;
      top = flipY ? pointerY - CARD_GAP - h : pointerY + CARD_GAP;
    }

    left = Math.max(CARD_EDGE, Math.min(left, vw - w - CARD_EDGE));
    top = Math.max(CARD_EDGE, Math.min(top, vh - h - CARD_EDGE));
    cardEl.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    // Hidden until first placed, so it never flashes at the top-left.
    cardEl.style.visibility = "visible";
  }

  /**
   * @typedef {{ left: number; top: number; width: number; height: number }} Box
   * @typedef {{ side: string; value: number; x: number; y: number }} SideLabel
   * @typedef {{ x1: number; y1: number; x2: number; y2: number; value: number }} Segment
   */

  /** @type {null | { rect: DOMRect; marginBox: Box; marginWidths: number[]; paddingBox: Box; paddingWidths: number[]; contentBox: Box; labels: (SideLabel & { kind: "margin" | "padding" })[]; info: { name: string; size: string; margin: number[]; padding: number[]; gap: { row: number; column: number } | null; type: string[] | null; typeSpec: string; colors: ColorInfo | null } }} */
  let hover = null;

  /** @type {null | { a: DOMRect; b: DOMRect; segments: Segment[] }} */
  let distance = null;

  /**
   * @param {DOMRect} rect
   * @param {number[]} m
   * @param {number[]} b
   * @param {number[]} p
   */
  function boxes(rect, m, b, p) {
    const [mt, mr, mb, ml] = m.map((v) => Math.max(0, v));
    const marginBox = {
      left: rect.left - ml,
      top: rect.top - mt,
      width: rect.width + ml + mr,
      height: rect.height + mt + mb,
    };
    const paddingBox = {
      left: rect.left + b[3],
      top: rect.top + b[0],
      width: Math.max(0, rect.width - b[1] - b[3]),
      height: Math.max(0, rect.height - b[0] - b[2]),
    };
    const contentBox = {
      left: paddingBox.left + p[3],
      top: paddingBox.top + p[0],
      width: Math.max(0, paddingBox.width - p[1] - p[3]),
      height: Math.max(0, paddingBox.height - p[0] - p[2]),
    };
    return {
      marginBox,
      paddingBox,
      contentBox,
      marginWidths: [mt, mr, mb, ml],
    };
  }

  /**
   * Labels centered in each non-zero side of a ring between `outer` and
   * `inner`.
   * @param {Box} outer
   * @param {Box} inner
   * @param {number[]} values top, right, bottom, left (signed)
   */
  function ringLabels(outer, inner, values) {
    const cx = inner.left + inner.width / 2;
    const cy = inner.top + inner.height / 2;
    /** @type {SideLabel[]} */
    const labels = [];
    const [t, r, b, l] = values;
    if (t)
      labels.push({
        side: "top",
        value: t,
        x: cx,
        y: (outer.top + inner.top) / 2,
      });
    if (r)
      labels.push({
        side: "right",
        value: r,
        x: (inner.left + inner.width + outer.left + outer.width) / 2,
        y: cy,
      });
    if (b)
      labels.push({
        side: "bottom",
        value: b,
        x: cx,
        y: (inner.top + inner.height + outer.top + outer.height) / 2,
      });
    if (l)
      labels.push({
        side: "left",
        value: l,
        x: (outer.left + inner.left) / 2,
        y: cy,
      });
    return labels;
  }

  /**
   * Distance segments between two rects along one axis. Separated rects
   * get one segment across the gap; overlapping or nested rects get one
   * segment per pair of edges that differ.
   * @param {number} a1
   * @param {number} a2
   * @param {number} b1
   * @param {number} b2
   * @returns {[number, number][]}
   */
  function axisSegments(a1, a2, b1, b2) {
    if (b1 >= a2) return [[a2, b1]];
    if (a1 >= b2) return [[b2, a1]];
    /** @type {[number, number][]} */
    const out = [];
    if (Math.abs(a1 - b1) >= 0.5)
      out.push([Math.min(a1, b1), Math.max(a1, b1)]);
    if (Math.abs(a2 - b2) >= 0.5)
      out.push([Math.min(a2, b2), Math.max(a2, b2)]);
    return out;
  }

  /**
   * Where to draw a segment across the other axis: the middle of the
   * overlap if there is one, else the middle of the anchor.
   * @param {number} a1
   * @param {number} a2
   * @param {number} b1
   * @param {number} b2
   */
  function crossCenter(a1, a2, b1, b2) {
    const lo = Math.max(a1, b1);
    const hi = Math.min(a2, b2);
    return hi > lo ? (lo + hi) / 2 : (a1 + a2) / 2;
  }

  /**
   * @typedef {{ key: string; label: string; hex: string; swatch: string; tokens: string[]; inherited?: boolean; note?: boolean }} ColorRow
   * @typedef {{ rows: ColorRow[]; contrast: { ratio: number; aa: number; aaa: number; large: boolean; approximate: boolean } | null; tokens: boolean }} ColorInfo
   */

  /**
   * Text, background, and border colors of `el`, each named with the
   * theme tokens that resolve to it, plus the contrast of its own text.
   * @param {Element} el
   * @param {CSSStyleDeclaration} style
   * @param {number[]} border
   * @param {boolean} ownText
   * @returns {ColorInfo}
   */
  function describeColors(el, style, border, ownText) {
    /** @type {ColorRow[]} */
    const rows = [];
    /**
     * @param {string} key
     * @param {string} value
     * @param {import("./colors.js").ColorRole} role
     * @param {boolean} [inherited]
     */
    const add = (key, value, role, inherited) => {
      const rgba = toRgba(normalizeColor(value));
      if (!rgba || rgba[3] === 0) return;
      rows.push({
        key,
        label: COLOR_LABELS[key],
        hex: toHex(rgba),
        swatch: value,
        tokens: colorTokens(el, value, role),
        inherited,
      });
    };
    if (ownText) add("text", style.color, "text");
    const bg = effectiveBackground(el);
    if (bg.image) {
      rows.push({
        key: "bg",
        label: COLOR_LABELS.bg,
        hex: "Image or gradient",
        swatch: "transparent",
        tokens: [],
        note: true,
      });
    } else if (bg.own && bg.source) {
      add(
        "bg",
        getComputedStyle(bg.source).backgroundColor,
        "background",
        bg.source !== el,
      );
    }
    if (border.some((w) => w > 0)) {
      const side = ["Top", "Right", "Bottom", "Left"][
        border.findIndex((w) => w > 0)
      ];
      add("border", style[`border${side}Color`], "border");
    }
    return {
      rows,
      contrast: ownText ? textContrast(el) : null,
      tokens: hasTokens(),
    };
  }

  /** @type {Record<string, string>} */
  const COLOR_LABELS = {
    text: "Text color",
    bg: "Background",
    border: "Border color",
  };

  /** @param {number} ratio */
  function fmtRatio(ratio) {
    return `${Math.floor(ratio * 10) / 10}:1`;
  }

  function updateHover() {
    remPx =
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
      16;

    if (
      measure &&
      measuring &&
      anchor &&
      hovered &&
      anchor !== hovered &&
      anchor.isConnected
    ) {
      const a = anchor.getBoundingClientRect();
      const b = hovered.getBoundingClientRect();
      const y = crossCenter(a.top, a.bottom, b.top, b.bottom);
      const x = crossCenter(a.left, a.right, b.left, b.right);
      distance = {
        a,
        b,
        segments: [
          ...axisSegments(a.left, a.right, b.left, b.right).map(([x1, x2]) => ({
            x1,
            x2,
            y1: y,
            y2: y,
            value: x2 - x1,
          })),
          ...axisSegments(a.top, a.bottom, b.top, b.bottom).map(([y1, y2]) => ({
            x1: x,
            x2: x,
            y1,
            y2,
            value: y2 - y1,
          })),
        ],
      };
      hover = null;
      return;
    }

    distance = null;
    if (!hovered?.isConnected || (!spacing && !type && !colors)) {
      hover = null;
      return;
    }

    const rect = hovered.getBoundingClientRect();
    const style = getComputedStyle(hovered);
    const margin = sides(style, "margin");
    const border = sides(style, "border");
    const padding = sides(style, "padding");
    const { marginBox, paddingBox, contentBox, marginWidths } = boxes(
      rect,
      margin,
      border,
      padding,
    );
    const ownText = hasOwnText(hovered);
    const showType = type && ownText;

    hover = {
      rect,
      marginBox,
      marginWidths,
      paddingBox,
      paddingWidths: padding,
      contentBox,
      labels: spacing
        ? [
            ...ringLabels(marginBox, rect, margin).map((l) => ({
              ...l,
              kind: /** @type {const} */ ("margin"),
            })),
            ...ringLabels(paddingBox, contentBox, padding).map((l) => ({
              ...l,
              kind: /** @type {const} */ ("padding"),
            })),
          ]
        : [],
      info: {
        name: describe(hovered),
        size: `${fmt(rect.width)} × ${fmt(rect.height)}px`,
        margin,
        padding,
        gap: gaps(style),
        type: showType ? typeTokens(style) : null,
        typeSpec: `${fmt(Number.parseFloat(style.fontSize))}/${fmt(Number.parseFloat(style.lineHeight) || 0)}px · weight ${style.fontWeight}`,
        colors: colors ? describeColors(hovered, style, border, ownText) : null,
      },
    };
  }

  /**
   * Tracks the pointer and the Alt key while the inspector is open. The
   * overlay is `pointer-events: none`, so the page stays fully usable and
   * `event.target` is always a page element.
   * @param {HTMLElement} _node
   */
  function trackPointer(_node) {
    let frame = 0;
    const schedule = () => {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          updateHover();
          // The card's height can change with its content; place it once
          // the DOM has updated.
          tick().then(placeCard);
        });
    };

    let cardFrame = 0;
    const scheduleCard = () => {
      if (!cardFrame)
        cardFrame = requestAnimationFrame(() => {
          cardFrame = 0;
          placeCard();
        });
    };

    /** Element under the pointer, shown or not. */
    /** @type {Element | null} */
    let pointerTarget = null;
    let shown = false;
    let hiddenAt = Number.NEGATIVE_INFINITY;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let enterTimer;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let leaveTimer;

    const show = () => {
      enterTimer = undefined;
      shown = true;
      hovered = pointerTarget;
      schedule();
    };
    const hide = () => {
      leaveTimer = undefined;
      shown = false;
      hiddenAt = performance.now();
      hovered = null;
      schedule();
    };

    /**
     * Follows TooltipGroup timing: the first element shows after the
     * pointer rests for `enterDelayMs`; while shown, moving to another
     * element is instant; leaving every element hides after
     * `leaveDelayMs`; coming back within `skipDelayMs` is instant again.
     * @param {Element | null} target
     */
    const point = (target) => {
      if (target === pointerTarget) return;
      pointerTarget = target;

      // Measuring tracks the pointer with no delay.
      if (measuring) {
        hovered = target;
        schedule();
        return;
      }

      if (target) {
        clearTimeout(leaveTimer);
        leaveTimer = undefined;
        if (shown) {
          hovered = target;
          schedule();
        } else if (
          enterDelayMs <= 0 ||
          performance.now() - hiddenAt < skipDelayMs
        ) {
          show();
        } else {
          // Restart on every new element, so only a resting pointer shows.
          clearTimeout(enterTimer);
          enterTimer = setTimeout(show, enterDelayMs);
        }
      } else {
        clearTimeout(enterTimer);
        enterTimer = undefined;
        if (shown && leaveTimer === undefined) {
          if (leaveDelayMs <= 0) hide();
          else leaveTimer = setTimeout(hide, leaveDelayMs);
        }
      }
    };

    /** @param {PointerEvent} e */
    const onMove = (e) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      scheduleCard();
      const target = /** @type {Element | null} */ (e.target);
      point(
        target &&
          target !== document.documentElement &&
          target !== document.body &&
          !target.closest(DEVTOOLS)
          ? target
          : null,
      );
    };
    const onLeave = () => point(null);
    /** @param {KeyboardEvent} e */
    const onKeyDown = (e) => {
      if (!measure || e.key !== measureKey || measuring) return;
      measuring = true;
      anchor = hovered ?? pointerTarget;
      hovered = pointerTarget;
      schedule();
    };
    /** @param {KeyboardEvent} e */
    const onKeyUp = (e) => {
      if (e.key !== measureKey || !measuring) return;
      measuring = false;
      anchor = null;
      // Back to the box model of what is under the pointer, at once.
      shown = pointerTarget !== null;
      hovered = pointerTarget;
      schedule();
    };
    const onBlur = () => {
      measuring = false;
      anchor = null;
      schedule();
    };
    const onResize = () => {
      typeTable = null;
      schedule();
    };

    document.addEventListener("pointermove", onMove, {
      passive: true,
      capture: true,
    });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("scroll", schedule, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", onResize, { passive: true });

    return {
      destroy() {
        document.removeEventListener("pointermove", onMove, { capture: true });
        document.documentElement.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        window.removeEventListener("blur", onBlur);
        window.removeEventListener("scroll", schedule, { capture: true });
        window.removeEventListener("resize", onResize);
        if (frame) cancelAnimationFrame(frame);
        if (cardFrame) cancelAnimationFrame(cardFrame);
        clearTimeout(enterTimer);
        clearTimeout(leaveTimer);
        hovered = null;
        anchor = null;
        measuring = false;
        hover = null;
        distance = null;
      },
    };
  }

  // ---------------------------------------------------------------------
  // Page scans: lint and target size

  /** @type {LayoutInspectorMark[]} */
  let lintMarks = [];
  /** @type {LayoutInspectorMark[]} */
  let targetMarks = [];
  /** @type {LayoutInspectorMark[]} */
  let contrastMarks = [];
  /** @type {LayoutInspectorMark[]} */
  let overflowMarks = [];

  const SPACING_PROPS = [
    ["marginTop", "margin-top"],
    ["marginRight", "margin-right"],
    ["marginBottom", "margin-bottom"],
    ["marginLeft", "margin-left"],
    ["paddingTop", "padding-top"],
    ["paddingRight", "padding-right"],
    ["paddingBottom", "padding-bottom"],
    ["paddingLeft", "padding-left"],
  ];

  /**
   * @param {Element} el
   * @param {string} ignore
   */
  function matchesSafe(el, ignore) {
    if (!ignore) return false;
    try {
      return el.matches(ignore);
    } catch {
      return false;
    }
  }

  /**
   * Off-scale spacing on one element, as `prop value` strings.
   * `getComputedStyle` reports `auto` margins as their used pixel value,
   * so equal horizontal margins (centering) and margins wider than the
   * largest token are treated as `auto` and skipped.
   * @param {CSSStyleDeclaration} style
   */
  function offScale(style) {
    /** @type {string[]} */
    const found = [];
    const ml = Number.parseFloat(style.marginLeft) || 0;
    const mr = Number.parseFloat(style.marginRight) || 0;
    const centered = ml > 0 && Math.abs(ml - mr) < 0.5;
    const largest = SPACING_REM[SPACING_REM.length - 1] * remPx;
    for (const [key, name] of SPACING_PROPS) {
      const value = Number.parseFloat(style[key]) || 0;
      if (name.startsWith("margin")) {
        if (centered && (name === "margin-left" || name === "margin-right"))
          continue;
        if (Math.abs(value) > largest) continue;
      }
      if (spacingToken(value) === null) found.push(`${name} ${fmt(value)}`);
    }
    const gap = gaps(style);
    if (gap && gap.row === gap.column) {
      if (spacingToken(gap.row) === null) found.push(`gap ${fmt(gap.row)}`);
    } else if (gap) {
      if (spacingToken(gap.row) === null) found.push(`row-gap ${fmt(gap.row)}`);
      if (spacingToken(gap.column) === null) {
        found.push(`column-gap ${fmt(gap.column)}`);
      }
    }
    return found;
  }

  /**
   * Union of an element's box and its `<label>`s, since a label click
   * activates the control too.
   * @param {Element} el
   */
  function targetRect(el) {
    let { left, top, right, bottom } = el.getBoundingClientRect();
    const labels = /** @type {HTMLInputElement} */ (el).labels;
    if (labels) {
      for (const label of labels) {
        const r = label.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        left = Math.min(left, r.left);
        top = Math.min(top, r.top);
        right = Math.max(right, r.right);
        bottom = Math.max(bottom, r.bottom);
      }
    }
    return { left, top, width: right - left, height: bottom - top };
  }

  /**
   * Text below WCAG AA contrast. Disabled controls are exempt in WCAG
   * 1.4.3, so text inside `disabled` or `aria-disabled` elements is skipped.
   * @param {number} sx
   * @param {number} sy
   */
  function scanContrast(sx, sy) {
    /** @type {LayoutInspectorMark[]} */
    const marks = [];
    /** @type {Set<Element>} */
    const seen = new Set();
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    for (
      let text = walker.nextNode();
      text && marks.length < MAX_MARKS;
      text = walker.nextNode()
    ) {
      const el = text.parentElement;
      if (!el || seen.has(el) || !text.nodeValue?.trim()) continue;
      seen.add(el);
      if (
        el.closest(DEVTOOLS) ||
        el.closest("script, style, [disabled], [aria-disabled='true']")
      ) {
        continue;
      }
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) continue;
      const result = textContrast(el);
      // A background image hides the real background; leave it to a person.
      if (result.approximate || result.ratio >= result.aa) continue;
      marks.push({
        x: r.left + sx,
        y: r.top + sy,
        width: r.width,
        height: r.height,
        text: `${fmtRatio(result.ratio)} · needs ${result.aa}:1`,
      });
    }
    return marks;
  }

  const CLIPS = new Set(["hidden", "clip"]);
  const SCROLLS = new Set(["auto", "scroll", "hidden", "clip"]);

  /**
   * Two kinds of overflow:
   * - Culprits of horizontal page scroll: elements that reach past the
   *   right (or, in RTL, left) edge of the page while their parent does
   *   not, and that no ancestor clips or scrolls.
   * - Clipped content: `overflow: hidden` or `clip` boxes whose content is
   *   larger than the box, including `text-overflow: ellipsis` truncation.
   *   Scrollable boxes are left alone, and so are 1px visually hidden
   *   helpers.
   * @param {number} sx
   * @param {number} sy
   */
  function scanOverflow(sx, sy) {
    /** @type {LayoutInspectorMark[]} */
    const marks = [];
    const pageWidth = document.documentElement.clientWidth;
    const pageScrolls = document.documentElement.scrollWidth > pageWidth + 1;

    for (const el of document.body.querySelectorAll("*")) {
      if (marks.length >= MAX_MARKS) break;
      if (el.closest(DEVTOOLS)) continue;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.display === "contents") continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) continue;

      if (pageScrolls && style.position !== "fixed") {
        const right = r.right + sx - pageWidth;
        const left = -(r.left + sx);
        const past = Math.max(right, left);
        if (past > 0.5) {
          const parent = el.parentElement?.getBoundingClientRect();
          const parentPast = parent
            ? Math.max(parent.right + sx - pageWidth, -(parent.left + sx))
            : 0;
          let contained = false;
          for (
            let a = el.parentElement;
            a && a !== document.body;
            a = a.parentElement
          ) {
            if (SCROLLS.has(getComputedStyle(a).overflowX)) {
              contained = true;
              break;
            }
          }
          if (parentPast <= 0.5 && !contained) {
            marks.push({
              x: r.left + sx,
              y: r.top + sy,
              width: r.width,
              height: r.height,
              text: `${fmt(past)}px past the page`,
            });
            continue;
          }
        }
      }

      const clipsX = CLIPS.has(style.overflowX);
      const clipsY = CLIPS.has(style.overflowY);
      if (!clipsX && !clipsY) continue;
      const overX = clipsX ? el.scrollWidth - el.clientWidth : 0;
      const overY = clipsY ? el.scrollHeight - el.clientHeight : 0;
      if (overX <= 1 && overY <= 1) continue;
      const truncated = style.textOverflow === "ellipsis" && overX > 1;
      marks.push({
        x: r.left + sx,
        y: r.top + sy,
        width: r.width,
        height: r.height,
        text: truncated
          ? `truncated · ${fmt(overX)}px hidden`
          : [
              overX > 1 && `clips ${fmt(overX)}px across`,
              overY > 1 && `clips ${fmt(overY)}px down`,
            ]
              .filter(Boolean)
              .join(" · "),
      });
    }
    return marks;
  }

  /**
   * Scans the page for `lint` and `targets` marks, in page coordinates.
   * Rescans when the page resizes or changes; scrolling only moves the
   * layer.
   * @param {HTMLElement} node
   * @param {{ lint: boolean; ignore: string; targets: boolean; targetSize: number; contrast: boolean; overflow: boolean }} params
   */
  function scanPage(node, params) {
    let current = params;
    let scanFrame = 0;
    let scrollFrame = 0;

    const scan = () => {
      scanFrame = 0;
      remPx =
        Number.parseFloat(
          getComputedStyle(document.documentElement).fontSize,
        ) || 16;
      const sx = window.scrollX;
      const sy = window.scrollY;
      /** @type {LayoutInspectorMark[]} */
      const nextLint = [];
      /** @type {LayoutInspectorMark[]} */
      const nextTargets = [];

      if (current.lint) {
        for (const el of document.body.querySelectorAll("*")) {
          if (nextLint.length >= MAX_MARKS) break;
          if (el.closest(DEVTOOLS) || matchesSafe(el, current.ignore)) continue;
          const style = getComputedStyle(el);
          if (style.display === "none" || style.display === "contents")
            continue;
          const found = offScale(style);
          if (!found.length) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 1 && r.height < 1) continue;
          nextLint.push({
            x: r.left + sx,
            y: r.top + sy,
            width: r.width,
            height: r.height,
            text:
              found.length > 3
                ? `${found.slice(0, 3).join(" · ")} · +${found.length - 3}`
                : found.join(" · "),
          });
        }
      }

      if (current.targets) {
        for (const el of document.body.querySelectorAll(INTERACTIVE)) {
          if (nextTargets.length >= MAX_MARKS) break;
          if (el.closest(DEVTOOLS)) continue;
          const style = getComputedStyle(el);
          if (style.visibility === "hidden") continue;
          // Targets in a sentence are exempt in WCAG 2.5.8: skip inline
          // elements whose parent also holds running text.
          if (
            style.display.startsWith("inline") &&
            el.parentElement &&
            hasOwnText(el.parentElement)
          ) {
            continue;
          }
          const r = targetRect(el);
          // Zero-size and visually hidden (1px) controls have no target
          // of their own; their label is checked instead.
          if (r.width <= 1 || r.height <= 1) continue;
          if (r.width >= current.targetSize && r.height >= current.targetSize)
            continue;
          nextTargets.push({
            x: r.left + sx,
            y: r.top + sy,
            width: r.width,
            height: r.height,
            text: `${fmt(r.width)} × ${fmt(r.height)}`,
          });
        }
      }

      lintMarks = nextLint;
      targetMarks = nextTargets;
      contrastMarks = current.contrast ? scanContrast(sx, sy) : [];
      overflowMarks = current.overflow ? scanOverflow(sx, sy) : [];
      onScroll();
    };

    const schedule = () => {
      if (!scanFrame) scanFrame = requestAnimationFrame(scan);
    };

    const onScroll = () => {
      scrollFrame = 0;
      node.style.setProperty(
        "--ccs-layout-inspector-x",
        `${-window.scrollX}px`,
      );
      node.style.setProperty(
        "--ccs-layout-inspector-y",
        `${-window.scrollY}px`,
      );
    };
    const scheduleScroll = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(onScroll);
    };

    // Ignore the inspector's own re-renders, or every mark would rescan.
    const mutations = new MutationObserver((records) => {
      if (
        records.some(
          (r) =>
            !(
              r.target instanceof Element ? r.target : r.target.parentElement
            )?.closest(DEVTOOLS),
        )
      ) {
        schedule();
      }
    });
    mutations.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden"],
    });
    const resizes = new ResizeObserver(schedule);
    resizes.observe(document.documentElement);
    window.addEventListener("scroll", scheduleScroll, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    // Hover, focus, and press states animate in; rescan once they settle
    // rather than reading colors mid-transition.
    document.addEventListener("transitionend", schedule, true);
    document.addEventListener("animationend", schedule, true);
    document.fonts?.ready.then(schedule);
    scan();

    return {
      /** @param {{ lint: boolean; ignore: string; targets: boolean; targetSize: number; contrast: boolean; overflow: boolean }} next */
      update(next) {
        current = next;
        schedule();
      },
      destroy() {
        mutations.disconnect();
        resizes.disconnect();
        window.removeEventListener("scroll", scheduleScroll);
        window.removeEventListener("resize", schedule);
        document.removeEventListener("transitionend", schedule, true);
        document.removeEventListener("animationend", schedule, true);
        if (scanFrame) cancelAnimationFrame(scanFrame);
        if (scrollFrame) cancelAnimationFrame(scrollFrame);
        lintMarks = [];
        targetMarks = [];
        contrastMarks = [];
        overflowMarks = [];
      },
    };
  }

  /**
   * Each distinct non-zero value in a set of side values, with its token
   * name or "off-scale", one card line each.
   * @param {number[]} values
   */
  function sideTokens(values) {
    const distinct = [
      ...new Set(values.filter((v) => Math.abs(v) >= 0.5).map(fmt)),
    ];
    return distinct.map((v) => {
      const token = spacingToken(Number(v));
      return { value: v, token: token ?? "off-scale", off: token === null };
    });
  }

  /** @param {Box} box */
  function boxStyle(box) {
    return `left: ${box.left}px; top: ${box.top}px; width: ${box.width}px; height: ${box.height}px;`;
  }

  $: inspectorClass = [$$restProps.class, "bx--layout-inspector"]
    .filter(Boolean)
    .join(" ");
</script>

{#if open}
  <div
    {...$$restProps}
    class={inspectorClass}
    aria-hidden="true"
    data-ccs-devtools
    use:trackPointer
  >
    {#if lint || targets || contrast || overflow}
      <div
        class="bx--layout-inspector__page"
        use:scanPage={{
          lint,
          ignore: [lintCarbon ? "" : CARBON_ELEMENTS, lintIgnore]
            .filter(Boolean)
            .join(", "),
          targets,
          targetSize,
          contrast,
          overflow,
        }}
      >
        {#each lintMarks as mark, i (i)}
          <div
            class="bx--layout-inspector__mark bx--layout-inspector__mark--lint"
            style={boxStyle({
              left: mark.x,
              top: mark.y,
              width: mark.width,
              height: mark.height,
            })}
          >
            <span class="bx--layout-inspector__mark-label">{mark.text}</span>
          </div>
        {/each}
        {#each targetMarks as mark, i (i)}
          <div
            class="bx--layout-inspector__mark bx--layout-inspector__mark--target"
            style={boxStyle({
              left: mark.x,
              top: mark.y,
              width: mark.width,
              height: mark.height,
            })}
          >
            <span class="bx--layout-inspector__mark-label">{mark.text}</span>
          </div>
        {/each}
        {#each contrastMarks as mark, i (i)}
          <div
            class="bx--layout-inspector__mark bx--layout-inspector__mark--contrast"
            style={boxStyle({
              left: mark.x,
              top: mark.y,
              width: mark.width,
              height: mark.height,
            })}
          >
            <span class="bx--layout-inspector__mark-label">{mark.text}</span>
          </div>
        {/each}
        {#each overflowMarks as mark, i (i)}
          <div
            class="bx--layout-inspector__mark bx--layout-inspector__mark--overflow"
            style={boxStyle({
              left: mark.x,
              top: mark.y,
              width: mark.width,
              height: mark.height,
            })}
          >
            <span class="bx--layout-inspector__mark-label">{mark.text}</span>
          </div>
        {/each}
      </div>
    {/if}

    {#if hover}
      {#if spacing}
        <div
          class="bx--layout-inspector__margin"
          style="{boxStyle(hover.marginBox)} border-width: {hover.marginWidths
            .map((v) => `${v}px`)
            .join(" ")};"
        ></div>
        <div
          class="bx--layout-inspector__padding"
          style="{boxStyle(hover.paddingBox)} border-width: {hover.paddingWidths
            .map((v) => `${Math.max(0, v)}px`)
            .join(" ")};"
        ></div>
        <div
          class="bx--layout-inspector__content"
          style={boxStyle(hover.contentBox)}
        ></div>
        {#each hover.labels as label (label.kind + label.side)}
          <span
            class="bx--layout-inspector__side bx--layout-inspector__side--{label.kind}"
            class:bx--layout-inspector__side--off={spacingToken(label.value) ===
              null}
            style="left: {label.x}px; top: {label.y}px;"
            >{fmt(label.value)}</span
          >
        {/each}
      {:else}
        <div
          class="bx--layout-inspector__outline"
          style={boxStyle(hover.rect)}
        ></div>
      {/if}
      <div class="bx--layout-inspector__card" bind:this={cardEl}>
        <p class="bx--layout-inspector__card-title">{hover.info.name}</p>
        <p class="bx--layout-inspector__card-meta">{hover.info.size}</p>
        <dl class="bx--layout-inspector__list">
          {#if spacing}
            {#each [
              { key: "margin", label: "Margin", values: hover.info.margin },
              { key: "padding", label: "Padding", values: hover.info.padding },
              ...(hover.info.gap
                ? [
                    {
                      key: "gap",
                      label: "Gap",
                      values: [hover.info.gap.row, hover.info.gap.column],
                    },
                  ]
                : []),
            ] as group (group.key)}
              {@const lines = sideTokens(group.values)}
              {#if lines.length}
                <div class="bx--layout-inspector__item">
                  <dt
                    class="bx--layout-inspector__term bx--layout-inspector__term--{group.key}"
                  >
                    {group.label}
                  </dt>
                  {#each lines as line (line.value)}
                    <dd class="bx--layout-inspector__desc">
                      {line.value}px ·
                      {#if line.off}
                        <span class="bx--layout-inspector__off">off-scale</span>
                      {:else}
                        <code>{line.token}</code>
                      {/if}
                    </dd>
                  {/each}
                </div>
              {/if}
            {/each}
          {/if}
          {#if hover.info.type}
            <div class="bx--layout-inspector__item">
              <dt class="bx--layout-inspector__term">Type</dt>
              <dd class="bx--layout-inspector__desc">
                {#if hover.info.type.length}
                  <code>{hover.info.type.join(" / ")}</code>
                {:else}
                  <span class="bx--layout-inspector__off">No token</span>
                {/if}
              </dd>
              <dd class="bx--layout-inspector__desc">{hover.info.typeSpec}</dd>
            </div>
          {/if}
          {#if hover.info.colors}
            {#each hover.info.colors.rows as row (row.key)}
              <div class="bx--layout-inspector__item">
                <dt class="bx--layout-inspector__term">{row.label}</dt>
                <dd class="bx--layout-inspector__desc">
                  {#if row.note}
                    {row.hex}
                  {:else}
                    <span
                      class="bx--layout-inspector__swatch"
                      style="background: {row.swatch};"
                    ></span>
                    <code>{row.hex}</code>{row.inherited ? " · inherited" : ""}
                  {/if}
                </dd>
                {#if row.tokens.length}
                  <dd class="bx--layout-inspector__desc">
                    <code
                      >{row.tokens.slice(0, 2).join(" / ")}{row.tokens.length >
                      2
                        ? ` +${row.tokens.length - 2}`
                        : ""}</code
                    >
                  </dd>
                {:else if hover.info.colors.tokens && !row.note}
                  <dd
                    class="bx--layout-inspector__desc bx--layout-inspector__off"
                  >
                    Off-palette
                  </dd>
                {/if}
              </div>
            {/each}
            {#if hover.info.colors.contrast}
              {@const c = hover.info.colors.contrast}
              <div class="bx--layout-inspector__item">
                <dt class="bx--layout-inspector__term">Contrast</dt>
                {#if c.approximate}
                  <dd class="bx--layout-inspector__desc">
                    Unknown over a background image
                  </dd>
                {:else}
                  <dd
                    class="bx--layout-inspector__desc"
                    class:bx--layout-inspector__off={c.ratio < c.aa}
                    class:bx--layout-inspector__pass={c.ratio >= c.aa}
                  >
                    {fmtRatio(c.ratio)}
                    ·
                    {c.ratio >= c.aaa
                      ? "AAA"
                      : c.ratio >= c.aa
                        ? "AA"
                        : `fails AA, needs ${c.aa}:1`}
                  </dd>
                {/if}
              </div>
            {/if}
          {/if}
        </dl>
        {#if measure}
          <p class="bx--layout-inspector__hint">
            Hold {KEY_LABELS[measureKey]} to measure
          </p>
        {/if}
      </div>
    {/if}

    {#if distance}
      <div
        class="bx--layout-inspector__outline bx--layout-inspector__outline--anchor"
        style={boxStyle(distance.a)}
      ></div>
      <div
        class="bx--layout-inspector__outline"
        style={boxStyle(distance.b)}
      ></div>
      {#each distance.segments as seg, i (i)}
        <div
          class="bx--layout-inspector__segment"
          class:bx--layout-inspector__segment--vertical={seg.x1 === seg.x2}
          style="left: {Math.min(seg.x1, seg.x2)}px; top: {Math.min(
            seg.y1,
            seg.y2,
          )}px; width: {Math.abs(seg.x2 - seg.x1)}px; height: {Math.abs(
            seg.y2 - seg.y1,
          )}px;"
        >
          <span
            class="bx--layout-inspector__segment-label"
            class:bx--layout-inspector__side--off={spacingToken(seg.value) ===
              null}
          >
            {fmt(seg.value)}{spacingToken(seg.value) &&
            spacingToken(seg.value) !== "0"
              ? ` · ${spacingToken(seg.value)}`
              : ""}
          </span>
        </div>
      {/each}
    {/if}

    {#if lint || targets || contrast || overflow}
      <div class="bx--layout-inspector__summary">
        {#if lint}
          <span>{lintMarks.length} off-scale</span>
        {/if}
        {#if targets}
          <span>{targetMarks.length} under {targetSize}px</span>
        {/if}
        {#if contrast}
          <span>{contrastMarks.length} low contrast</span>
        {/if}
        {#if overflow}
          <span>{overflowMarks.length} overflowing</span>
        {/if}
      </div>
    {/if}
  </div>
{/if}
