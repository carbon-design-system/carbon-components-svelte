// @ts-check
import {
  colorTokens,
  effectiveBackground,
  hasTokens,
  normalizeColor,
  textContrast,
  toHex,
  toRgba,
} from "./LayoutInspector/colors.js";
import { carbonBlock, carbonOwned, cssPath, hasOwnText } from "./audit.js";
import { formatPx, gaps, sideTokens } from "./spacing.js";

// Token names per color in `inspect`.
const MAX_TOKENS = 3;

/**
 * What LayoutInspector's card shows about one element, as plain DOM code:
 * the card draws it, and `inspect` returns it as data.
 */

// Carbon v11 type styles, matching the library's `bx--type-*` classes.
const TYPE_TOKENS = [
  "label-01",
  "label-02",
  "helper-text-01",
  "helper-text-02",
  "legal-01",
  "legal-02",
  "body-compact-01",
  "body-compact-02",
  "body-01",
  "body-02",
  "code-01",
  "code-02",
  "heading-compact-01",
  "heading-compact-02",
  "heading-01",
  "heading-02",
  "heading-03",
  "heading-04",
  "heading-05",
  "heading-06",
  "heading-07",
  "fluid-heading-03",
  "fluid-heading-04",
  "fluid-heading-05",
  "fluid-heading-06",
  "fluid-paragraph-01",
  "fluid-quotation-01",
  "fluid-quotation-02",
  "fluid-display-01",
  "fluid-display-02",
  "fluid-display-03",
  "fluid-display-04",
];

/**
 * Type token table, measured from the library's own `bx--type-*` classes
 * at the current viewport, so fluid and responsive tokens match too.
 * @type {{ name: string; size: number; lineHeight: number; weight: string; letterSpacing: number; family: string }[] | null}
 */
let typeTable = null;

/** Measure the type tokens again, for example after a resize. */
export function resetTypeTable() {
  typeTable = null;
}

function buildTypeTable() {
  const box = document.createElement("div");
  box.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
  // Marked as a dev tool, so adding it does not trigger a page scan.
  box.setAttribute("data-ccs-dev-tool", "");
  for (const name of TYPE_TOKENS) {
    const probe = document.createElement("span");
    probe.className = `bx--type-${name}`;
    probe.textContent = "x";
    box.append(probe);
  }
  // In <body>, so the probes inherit the page's font family.
  document.body.append(box);
  const table = [...box.children].map((probe, index) => {
    const style = getComputedStyle(probe);
    return {
      name: TYPE_TOKENS[index],
      size: Number.parseFloat(style.fontSize),
      lineHeight: Number.parseFloat(style.lineHeight),
      weight: style.fontWeight,
      letterSpacing: Number.parseFloat(style.letterSpacing) || 0,
      family: style.fontFamily,
    };
  });
  box.remove();
  return table;
}

/**
 * Type tokens whose size, line height, weight, letter spacing, and family
 * all match `style`. Aliases such as `label-01` and `legal-01` can match
 * together.
 * @param {CSSStyleDeclaration} style
 */
export function typeTokens(style) {
  typeTable ??= buildTypeTable();
  const size = Number.parseFloat(style.fontSize);
  const lineHeight = Number.parseFloat(style.lineHeight);
  const letterSpacing = Number.parseFloat(style.letterSpacing) || 0;
  return typeTable
    .filter(
      (token) =>
        Math.abs(token.size - size) < 0.5 &&
        Math.abs(token.lineHeight - lineHeight) < 0.5 &&
        token.weight === style.fontWeight &&
        Math.abs(token.letterSpacing - letterSpacing) < 0.05 &&
        token.family === style.fontFamily,
    )
    .map((token) => token.name);
}

/**
 * @param {CSSStyleDeclaration} style
 * @param {"margin" | "padding" | "border"} prop
 * @returns {[number, number, number, number]} top, right, bottom, left
 */
export function sides(style, prop) {
  const suffix = prop === "border" ? "-width" : "";
  return /** @type {[number, number, number, number]} */ (
    ["top", "right", "bottom", "left"].map(
      (side) =>
        Number.parseFloat(style.getPropertyValue(`${prop}-${side}${suffix}`)) ||
        0,
    )
  );
}

/** @param {Element} el */
function describe(el) {
  const tag = el.tagName.toLowerCase();
  const cls = [...el.classList].find((c) => !c.startsWith("svelte-"));
  return cls ? `${tag}.${cls}` : tag;
}

/**
 * @typedef {{ key: "text" | "bg" | "border"; label: string; hex: string; swatch: string; tokens: string[]; inherited?: boolean; note?: boolean }} ColorRow
 * @typedef {{ ratio: number; aa: number; aaa: number; large: boolean; approximate: boolean }} Contrast
 * @typedef {{ rows: ColorRow[]; contrast: Contrast | null; tokens: boolean }} ColorInfo
 */

const COLOR_LABELS = {
  text: "Text color",
  bg: "Background",
  border: "Border color",
};

/**
 * Text, background, and border colors of `el`, each named with the theme
 * tokens that resolve to it, plus the contrast of its own text.
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
   * @param {"text" | "bg" | "border"} key
   * @param {string} value
   * @param {import("./LayoutInspector/colors.js").ColorRole} role
   * @param {boolean} [inherited]
   */
  function add(key, value, role, inherited) {
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
  }
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
    const side = ["top", "right", "bottom", "left"][
      border.findIndex((w) => w > 0)
    ];
    add("border", style.getPropertyValue(`border-${side}-color`), "border");
  }
  return {
    rows,
    contrast: ownText ? textContrast(el) : null,
    tokens: hasTokens(),
  };
}

/**
 * @typedef {{ name: string; size: string; margin: number[]; padding: number[]; border: number[]; carbon: boolean; gap: { row: number; column: number } | null; type: string[] | null; typeSpec: string; colors: ColorInfo | null }} ElementInfo
 */

/**
 * Everything the card shows about `el`. `carbon` is true when Carbon
 * styles it and the caller does not check Carbon: its off-scale values
 * then read "set by Carbon", not as errors.
 * @param {Element} el
 * @param {{ checkCarbon?: boolean; typography?: boolean; colors?: boolean }} [options]
 * @returns {{ rect: DOMRect; style: CSSStyleDeclaration; info: ElementInfo }}
 */
export function inspectElement(el, options = {}) {
  const { checkCarbon = false, typography = true, colors = true } = options;
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const margin = sides(style, "margin");
  const border = sides(style, "border");
  const padding = sides(style, "padding");
  const ownText = hasOwnText(el);
  return {
    rect,
    style,
    info: {
      name: describe(el),
      size: `${formatPx(rect.width)} × ${formatPx(rect.height)}px`,
      margin,
      padding,
      border,
      carbon: !checkCarbon && carbonOwned(el),
      gap: gaps(style),
      type: typography && ownText ? typeTokens(style) : null,
      typeSpec: `${formatPx(Number.parseFloat(style.fontSize))}/${formatPx(Number.parseFloat(style.lineHeight) || 0)}px · weight ${style.fontWeight}`,
      colors: colors ? describeColors(el, style, border, ownText) : null,
    },
  };
}

/**
 * The card's data for one element, as JSON, for scripts and agents:
 * spacing with token names, the type token, colors with token names, and
 * text contrast. `target` is an element or a selector.
 * @param {Element | string} target
 * @param {{ remPx?: number }} [options]
 */
export function inspect(target, options = {}) {
  const el =
    typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return null;
  const remPx =
    options.remPx ??
    (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
      16);
  const { rect, style, info } = inspectElement(el, { checkCarbon: true });
  const spacingOf = (/** @type {number[]} */ values) =>
    sideTokens(values, { remPx }).map((line) => ({
      px: Number(line.value),
      token: line.off ? null : line.token,
    }));
  const round = (/** @type {number} */ n) => Math.round(n * 10) / 10;
  return {
    selector: cssPath(el),
    carbon: carbonBlock(el),
    owner: carbonOwned(el) ? "carbon" : "app",
    rect: {
      left: round(rect.left + window.scrollX),
      top: round(rect.top + window.scrollY),
      width: round(rect.width),
      height: round(rect.height),
    },
    margin: { sides: info.margin, tokens: spacingOf(info.margin) },
    padding: {
      sides: info.padding,
      tokens: sideTokens(info.padding, { borders: info.border, remPx }).map(
        (line) => ({
          px: Number(line.value),
          token: line.off ? null : line.token,
          withBorder: line.withBorder ? Number(line.withBorder) : 0,
        }),
      ),
    },
    border: info.border,
    gap: info.gap,
    typography: hasOwnText(el)
      ? {
          tokens: info.type ?? [],
          size: Number.parseFloat(style.fontSize),
          lineHeight: Number.parseFloat(style.lineHeight) || null,
          weight: style.fontWeight,
          family: style.fontFamily,
        }
      : null,
    colors: (info.colors?.rows ?? []).map((row) => ({
      role: row.key === "bg" ? "background" : row.key,
      hex: row.note ? null : row.hex,
      // Best fit for the role first; one color can match a dozen tokens.
      tokens: row.tokens.slice(0, MAX_TOKENS),
      moreTokens: Math.max(0, row.tokens.length - MAX_TOKENS),
      inherited: Boolean(row.inherited),
      image: Boolean(row.note),
    })),
    contrast: info.colors?.contrast
      ? {
          ratio: Math.floor(info.colors.contrast.ratio * 100) / 100,
          aa: info.colors.contrast.aa,
          aaa: info.colors.contrast.aaa,
          large: info.colors.contrast.large,
          passes:
            !info.colors.contrast.approximate &&
            info.colors.contrast.ratio >= info.colors.contrast.aa,
          approximate: info.colors.contrast.approximate,
        }
      : null,
  };
}
