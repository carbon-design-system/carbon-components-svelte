// @ts-check
import {
  contrastRatio,
  parseHex,
  relativeLuminance,
  toHex,
} from "../utils/color-contrast.js";
import { carbonPalette } from "./carbon-palette.js";

/**
 * @typedef {"white" | "g10" | "g80" | "g90" | "g100"} CarbonTheme
 * @typedef {import("./carbon-tokens").CarbonToken} CarbonToken
 * @typedef {Partial<Record<CarbonToken, string>>} ThemeTokens
 * @typedef {{ foreground: CarbonToken; background: CarbonToken; ratio: number; minimum: number; message: string }} ContrastWarning
 * @typedef {number | "hover"} Step
 */

const THEMES = ["white", "g10", "g80", "g90", "g100"];

// Median luminance of each Carbon palette grade across the 12 families in
// @carbon/colors, from grade 0 (white) to 100. One grade has the same
// luminance in every family to within about 2%, which is why Carbon's
// contrast pairs hold for any hue. The last entry extends the 90 to 100 step
// to grade 110 for colors darker than the palette.
const GRADE_LUMINANCE = [
  1, 0.9034, 0.7474, 0.5661, 0.3933, 0.264, 0.1597, 0.0847, 0.0412, 0.0192,
  0.0078, 0.0032,
];

// Median ratio of a hover color's luminance to its grade's, for grades 10
// to 100 in @carbon/colors. Up to 60 the hover is darker; from 70 it is
// lighter.
const HOVER_RATIO = [
  0.8958, 0.8531, 0.8123, 0.795, 0.7351, 0.7016, 1.4878, 1.5928, 1.6639, 2.8473,
];

// Brand tokens as grade steps from the brand color, the way Carbon pairs them
// with blue 60: 10 turns blue 60 into blue 70, -20 into blue 40, and "hover"
// into blue 60 hover. From @carbon/themes for white, g10, g90 and g100, and
// from the v10 Gray 80 theme for g80. Carbon keeps `focus` white on dark
// themes, `link-visited` purple, and `support-info` blue, so none follow the
// brand.
/** @type {Record<string, Step>} */
const SHARED = {
  "button-primary": 0,
  "button-primary-hover": "hover",
  "button-primary-active": 20,
  "background-brand": 0,
};

/** @type {Record<string, Step>} */
const LIGHT = {
  ...SHARED,
  "button-tertiary": 0,
  "button-tertiary-hover": "hover",
  "button-tertiary-active": 20,
  interactive: 0,
  "border-interactive": 0,
  focus: 0,
  "icon-interactive": 0,
  "link-primary": 0,
  "link-primary-hover": 10,
  "link-secondary": 10,
  "link-inverse": -20,
  "link-inverse-hover": -30,
  highlight: -40,
};

/** @type {Record<string, Step>} */
const DARK = {
  ...SHARED,
  interactive: -10,
  "border-interactive": -10,
  "focus-inverse": 0,
  "link-primary": -20,
  "link-primary-hover": -30,
  "link-secondary": -30,
  "link-inverse": 0,
  "link-inverse-hover": 10,
};

/** @type {Record<CarbonTheme, Record<string, Step>>} */
const STEPS = {
  white: LIGHT,
  g10: LIGHT,
  g80: { ...DARK, interactive: -20, "border-interactive": -20, highlight: 20 },
  g90: { ...DARK, highlight: 20 },
  g100: { ...DARK, highlight: 30 },
};

/** @type {Record<CarbonTheme, Record<string, string>>} */
const BASE = {
  white: {
    background: "#ffffff",
    "text-on-color": "#ffffff",
    focus: "#0f62fe",
  },
  g10: { background: "#f4f4f4", "text-on-color": "#ffffff", focus: "#0f62fe" },
  g80: { background: "#393939", "text-on-color": "#ffffff", focus: "#ffffff" },
  g90: { background: "#262626", "text-on-color": "#ffffff", focus: "#ffffff" },
  g100: { background: "#161616", "text-on-color": "#ffffff", focus: "#ffffff" },
};

/** @type {[foreground: CarbonToken, background: CarbonToken, minimum: number][]} */
const CHECKS = [
  ["text-on-color", "button-primary", 4.5],
  ["link-primary", "background", 4.5],
  ["focus", "background", 3],
];

/** @type {Map<string, { family: string; index: number }> | undefined} */
let paletteIndex;

/** @param {string} hex */
function findInPalette(hex) {
  if (!paletteIndex) {
    paletteIndex = new Map();
    for (const [family, { grades }] of Object.entries(carbonPalette)) {
      for (const [index, grade] of grades.entries()) {
        paletteIndex.set(grade, { family, index });
      }
    }
  }
  return paletteIndex.get(hex);
}

/**
 * @param {[number, number, number]} rgb
 * @returns {[number, number, number]}
 */
function toHsl([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r
      ? (g - b) / d + (g < b ? 6 : 0)
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4;
  return [h / 6, s, l];
}

/**
 * @param {number} h
 * @param {number} s
 * @param {number} l
 * @returns {[number, number, number]}
 */
function fromHsl(h, s, l) {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  /** @param {number} t */
  function channel(t) {
    const x = (t + 1) % 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  }
  return [channel(h + 1 / 3), channel(h), channel(h - 1 / 3)];
}

/**
 * Continuous Carbon grade of a luminance, from 0 (white) to 110.
 * @param {number} luminance
 */
function gradeOf(luminance) {
  const last = GRADE_LUMINANCE.length - 1;
  if (luminance >= 1) return 0;
  if (luminance <= GRADE_LUMINANCE[last]) return last * 10;
  let i = 0;
  while (GRADE_LUMINANCE[i + 1] > luminance) i++;
  const from = GRADE_LUMINANCE[i];
  const to = GRADE_LUMINANCE[i + 1];
  return (i + Math.log(from / luminance) / Math.log(from / to)) * 10;
}

/** @param {number} grade */
function luminanceAt(grade) {
  const last = GRADE_LUMINANCE.length - 1;
  const x = Math.min(Math.max(grade / 10, 0), last);
  const i = Math.min(Math.floor(x), last - 1);
  return (
    GRADE_LUMINANCE[i] *
    (GRADE_LUMINANCE[i + 1] / GRADE_LUMINANCE[i]) ** (x - i)
  );
}

/** @param {number} grade */
function hoverRatio(grade) {
  // Stay on one side of 65 so a grade between 60 and 70 doesn't blend a
  // darker hover with a lighter one.
  const [min, max] = grade < 65 ? [0, 5] : [6, 9];
  const x = Math.min(Math.max(grade / 10 - 1, min), max);
  const i = Math.min(Math.floor(x), max - 1);
  return HOVER_RATIO[i] * (HOVER_RATIO[i + 1] / HOVER_RATIO[i]) ** (x - i);
}

/**
 * The color with this hue and saturation whose luminance is `target`.
 * @param {[number, number, number]} hsl
 * @param {number} target
 */
function withLuminance([h, s], target) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (relativeLuminance(fromHsl(h, s, mid)) < target) lo = mid;
    else hi = mid;
  }
  return toHex(fromHsl(h, s, (lo + hi) / 2));
}

/**
 * Colors at grade steps from `hex`. A Carbon palette color steps through its
 * own family. Any other color keeps its hue and saturation and takes the
 * luminance of the target grade, so it keeps Carbon's contrast.
 * @param {string} hex
 * @returns {(step: Step) => string}
 */
function createRamp(hex) {
  const rgb = /** @type {[number, number, number]} */ (parseHex(hex));
  const hsl = toHsl(rgb);
  const luminance = relativeLuminance(rgb);
  const grade = gradeOf(luminance);
  const match = findInPalette(hex);

  return (step) => {
    if (step === 0) return hex;
    if (match) {
      const { grades, hover } = carbonPalette[match.family];
      if (step === "hover") return hover[match.index];
      const index = match.index + step / 10;
      if (index >= 0 && index < grades.length) return grades[index];
    }
    if (step === "hover") {
      // Pure black has no luminance to scale, so start from grade 110.
      const base = Math.max(luminance, luminanceAt(grade));
      return withLuminance(hsl, Math.min(1, base * hoverRatio(grade)));
    }
    return withLuminance(hsl, luminanceAt(grade + step));
  };
}

/**
 * @param {CarbonTheme} theme
 * @param {ThemeTokens} tokens
 * @returns {ContrastWarning[]}
 */
function checkContrast(theme, tokens) {
  /** @type {ContrastWarning[]} */
  const warnings = [];
  for (const [foreground, background, minimum] of CHECKS) {
    const fg = tokens[foreground] ?? BASE[theme][foreground];
    const bg = tokens[background] ?? BASE[theme][background];
    const ratio = contrastRatio(fg, bg);
    if (ratio === null || ratio >= minimum) continue;
    const shown = Math.floor(ratio * 100) / 100;
    warnings.push({
      foreground,
      background,
      ratio: shown,
      minimum,
      message: `${foreground} (${fg}) on ${background} (${bg}) has a contrast of ${shown}:1. WCAG AA needs ${minimum}:1.`,
    });
  }
  return warnings;
}

/**
 * Build theme tokens from a brand color. The brand becomes `button-primary`,
 * and the tokens Carbon pairs with it (hover and active states, interactive
 * borders, focus, links, `background-brand`) are derived the way Carbon
 * derives them from blue 60 for the base `theme`. A Carbon palette color
 * uses Carbon's own steps; any other color keeps its hue and matches the
 * luminance of Carbon's steps, so contrast carries over.
 *
 * `tokens` are set as given and win over derived tokens; set one to
 * `undefined` to keep the base theme's value. `warnings` lists pairs below
 * WCAG AA: `text-on-color` on `button-primary` and `link-primary` on
 * `background` (4.5:1), and `focus` on `background` (3:1).
 * @param {{ theme?: CarbonTheme; brand: string; tokens?: ThemeTokens }} options
 * @returns {{ theme: CarbonTheme; tokens: ThemeTokens; warnings: ContrastWarning[]; css: (selector?: string) => string }}
 * @example
 * const { tokens, warnings } = createTheme({ theme: "g100", brand: "#d02670" });
 * // <Theme theme="g100" {tokens} />
 */
export function createTheme(options) {
  const { theme = "white", brand, tokens = {} } = options ?? {};
  if (!THEMES.includes(theme)) {
    throw new TypeError(
      `createTheme: unknown theme ${JSON.stringify(theme)}. Use one of: ${THEMES.join(", ")}.`,
    );
  }
  const rgb = parseHex(brand);
  if (!rgb) {
    throw new TypeError(
      `createTheme: brand must be a #rgb or #rrggbb color, got ${JSON.stringify(brand)}.`,
    );
  }

  const ramp = createRamp(toHex(rgb));
  /** @type {Record<string, string | undefined>} */
  const merged = {};
  for (const [token, step] of Object.entries(STEPS[theme])) {
    merged[token] = ramp(step);
  }
  Object.assign(merged, tokens);
  /** @type {ThemeTokens} */
  const result = {};
  for (const [token, value] of Object.entries(merged)) {
    if (value !== undefined) result[/** @type {CarbonToken} */ (token)] = value;
  }

  return {
    theme,
    tokens: result,
    warnings: checkContrast(theme, result),
    css(selector = `:root[theme="${theme}"]`) {
      const lines = Object.entries(result).map(
        ([token, value]) => `  --cds-${token}: ${value};`,
      );
      return `${selector} {\n${lines.join("\n")}\n}\n`;
    },
  };
}
