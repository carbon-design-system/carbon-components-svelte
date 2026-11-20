// @ts-check
// The theme builder's model: a base theme plus token overrides, how an
// override reaches the tokens Carbon derives from it, the token pairs whose
// contrast matters, and the export and import formats.
//
// Everything here is pure and runs without a DOM.

import { colorTokens, componentTokens } from "../tokens/index.js";
import {
  apca,
  contrast,
  formatHex,
  fromOklch,
  parseColor,
  toOklch,
} from "./color.js";

/**
 * @typedef {import("../Theme/Theme.svelte").CarbonTheme} CarbonTheme
 * @typedef {Record<string, string>} TokenMap Token name to CSS color.
 * @typedef {"override" | "derived" | "alias"} TokenSource How a token got its
 * value: typed by the user, derived from another token, or following a
 * numbered token (`layer` follows `layer-01`).
 */

/** The themes a builder can start from. */
export const THEME_NAMES = /** @type {const} */ ([
  "white",
  "g10",
  "g80",
  "g90",
  "g100",
]);

/** @type {Record<string, Record<string, string>>} */
const TOKENS = { ...colorTokens, ...componentTokens };

/** Every token the builder edits, in the order `all.css` declares them. */
export const TOKEN_NAMES = Object.keys(TOKENS);

const TOKEN_SET = new Set(TOKEN_NAMES);

/**
 * @param {string} name
 * @returns {boolean}
 */
export function isToken(name) {
  return TOKEN_SET.has(name);
}

/**
 * @param {string} name
 * @returns {name is CarbonTheme}
 */
export function isTheme(name) {
  return /** @type {readonly string[]} */ (THEME_NAMES).includes(name);
}

/**
 * The value a token has in a base theme.
 * @param {CarbonTheme} theme
 * @param {string} token
 * @returns {string | undefined}
 */
export function baseValue(theme, token) {
  return TOKEN_SET.has(token) ? TOKENS[token][theme] : undefined;
}

// ---------------------------------------------------------------------------
// Groups

/**
 * @typedef {{ id: string; label: string; description: string }} TokenGroup
 */

/** @type {readonly TokenGroup[]} */
export const TOKEN_GROUPS = [
  {
    id: "background",
    label: "Background",
    description: "The page surface and its inverse.",
  },
  {
    id: "layer",
    label: "Layer",
    description: "Surfaces stacked on the background, and their states.",
  },
  {
    id: "field",
    label: "Field",
    description: "Input fills and their hover states.",
  },
  { id: "border", label: "Border", description: "Dividers and outlines." },
  { id: "text", label: "Text", description: "Text colors." },
  { id: "icon", label: "Icon", description: "Icon colors." },
  {
    id: "interactive",
    label: "Interactive",
    description: "Brand, links, buttons, and toggles.",
  },
  {
    id: "support",
    label: "Support",
    description: "Error, success, warning, and info.",
  },
  { id: "focus", label: "Focus", description: "Focus rings." },
  {
    id: "components",
    label: "Components",
    description: "Tags, notifications, status, chat, and AI.",
  },
];

const GROUP_PATTERNS = /** @type {[string, RegExp][]} */ ([
  ["background", /^background/],
  ["layer", /^layer/],
  ["field", /^field/],
  ["border", /^border/],
  ["text", /^text/],
  ["icon", /^icon/],
  ["interactive", /^(?:interactive$|link-|button-|highlight$|toggle-)/],
  ["support", /^support/],
  ["focus", /^focus/],
]);

/**
 * The group a token is edited in.
 * @param {string} token
 * @returns {string}
 */
export function groupOf(token) {
  for (const [id, pattern] of GROUP_PATTERNS) {
    if (pattern.test(token)) return id;
  }
  return "components";
}

/**
 * Tokens by group, in `all.css` order.
 * @returns {Record<string, string[]>}
 */
export function tokensByGroup() {
  /** @type {Record<string, string[]>} */
  const groups = Object.fromEntries(TOKEN_GROUPS.map(({ id }) => [id, []]));
  for (const token of TOKEN_NAMES) groups[groupOf(token)].push(token);
  return groups;
}

// ---------------------------------------------------------------------------
// Values

const VALUE =
  /^(?:#[0-9a-f]{3,8}|rgba?\(\s*[\d.]+%?(?:\s*[,\s]\s*[\d.]+%?){2}(?:\s*[,/]\s*[\d.]+%?)?\s*\)|var\(--cds-[a-z0-9-]+\))$/i;
const VAR = /^var\(--cds-([a-z0-9-]+)\)$/i;

/**
 * Accept a color the builder can show, export, and put in a `style`
 * attribute without risk: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`,
 * `rgba()`, or `var(--cds-token)`. Anything else returns `null`, so a value
 * from a share link, a stored draft, or an imported file cannot add a
 * declaration, close a rule, or load a URL.
 * @param {unknown} value
 * @returns {string | null}
 */
export function normalizeValue(value) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text.length > 64 || !VALUE.test(text)) return null;
  if (!VAR.test(text) && !parseColor(text)) return null;
  return text.toLowerCase();
}

/**
 * Keep the entries that name a token and hold a safe value.
 * @param {unknown} input
 * @returns {{ tokens: TokenMap; invalid: string[] }}
 */
export function sanitizeTokens(input) {
  /** @type {TokenMap} */
  const tokens = {};
  /** @type {string[]} */
  const invalid = [];
  if (!input || typeof input !== "object") return { tokens, invalid };
  for (const [token, raw] of Object.entries(input)) {
    const value = normalizeValue(raw);
    if (value && TOKEN_SET.has(token)) tokens[token] = value;
    else invalid.push(token);
  }
  return { tokens, invalid };
}

// ---------------------------------------------------------------------------
// Derivation

/**
 * Move `source` by the step Carbon takes from `baseSource` to `baseTarget`,
 * in OKLCH: the same change in lightness, the same ratio of chroma, and the
 * source's own hue. Carbon v11 stores each hover, active, and selected color
 * as a palette value, not as a function of the base color. The step that
 * Carbon chose for the base theme is the only specification of "one step",
 * so this reads it from there.
 * @param {string} source The new color of the source token.
 * @param {string} baseSource The source token's color in the base theme.
 * @param {string} baseTarget The derived token's color in the base theme.
 * @returns {string | null} `#rrggbb`, or `null` when a color is translucent
 * or not a color.
 */
export function deriveColor(source, baseSource, baseTarget) {
  const colors = [source, baseSource, baseTarget].map(parseColor);
  const [s, sb, tb] = colors;
  if (!s || !sb || !tb || colors.some((c) => c && c.a < 1)) return null;
  const from = toOklch(s);
  const was = toOklch(sb);
  const to = toOklch(tb);
  return formatHex(
    fromOklch({
      l: from.l + (to.l - was.l),
      c: from.c * (was.c > 0.01 ? to.c / was.c : 1),
      h: from.h,
    }),
  );
}

/**
 * @typedef {{ token: string; from: string; themes?: readonly CarbonTheme[] }} Derivation
 */

/** @type {Derivation[]} */
const DERIVATIONS_LIST = [];
const LIGHT = /** @type {const} */ (["white", "g10"]);
const DARK = /** @type {const} */ (["g80", "g90", "g100"]);

/**
 * @param {string} from
 * @param {string[]} tokens
 * @param {readonly CarbonTheme[]} [themes]
 */
function derive(from, tokens, themes) {
  for (const token of tokens) DERIVATIONS_LIST.push({ token, from, themes });
}

// Order matters: a source comes before the tokens derived from it.
// The brand is `button-primary`: Carbon gives it one value in every theme,
// and steps the rest of the interactive tokens from it. In a dark theme
// `interactive` is a lighter step than the brand, as in Carbon.
derive("button-primary", [
  "button-primary-hover",
  "button-primary-active",
  "background-brand",
  "interactive",
  "highlight",
]);
derive("button-primary", ["button-tertiary"], LIGHT);
derive("button-primary", ["focus-inverse"], DARK);
derive("interactive", ["border-interactive", "link-primary", "link-inverse"]);
derive("interactive", ["icon-interactive", "focus"], LIGHT);
derive("link-primary", ["link-primary-hover", "link-secondary"]);
derive("link-inverse", ["link-inverse-hover", "link-inverse-active"]);
derive("button-secondary", [
  "button-secondary-hover",
  "button-secondary-active",
]);
derive("button-tertiary", ["button-tertiary-hover", "button-tertiary-active"]);
derive("support-error", [
  "text-error",
  "button-danger-primary",
  "button-danger-secondary",
]);
derive("button-danger-primary", [
  "button-danger-hover",
  "button-danger-active",
]);
derive("background-inverse", ["background-inverse-hover"]);
for (const level of ["01", "02", "03"]) {
  derive(`layer-${level}`, [
    `layer-hover-${level}`,
    `layer-active-${level}`,
    `layer-selected-${level}`,
    `layer-accent-${level}`,
  ]);
  derive(`layer-selected-${level}`, [`layer-selected-hover-${level}`]);
  derive(`layer-accent-${level}`, [
    `layer-accent-hover-${level}`,
    `layer-accent-active-${level}`,
  ]);
  derive(`field-${level}`, [`field-hover-${level}`]);
  derive(`border-subtle-${level}`, [`border-subtle-selected-${level}`]);
}
for (const color of [
  "red",
  "magenta",
  "purple",
  "blue",
  "cyan",
  "teal",
  "green",
  "gray",
  "cool-gray",
  "warm-gray",
]) {
  derive(`tag-background-${color}`, [`tag-hover-${color}`]);
}

/**
 * The edges of the derivation graph: `token` follows `from` unless the user
 * sets it. Listed source first.
 * @type {readonly Derivation[]}
 */
export const DERIVATIONS = DERIVATIONS_LIST;

/**
 * Contextual tokens and the numbered token each one is in the first layer.
 * `all.css` gives `--cds-layer` a literal value per theme and points it at
 * `--cds-layer-02` only inside a `Layer`, so an override of `layer-01` must
 * set `layer` too.
 * @type {Readonly<Record<string, string>>}
 */
export const CONTEXTUAL = {
  layer: "layer-01",
  "layer-accent": "layer-accent-01",
  "layer-accent-active": "layer-accent-active-01",
  "layer-accent-hover": "layer-accent-hover-01",
  "layer-active": "layer-active-01",
  "layer-background": "layer-background-01",
  "layer-hover": "layer-hover-01",
  "layer-selected": "layer-selected-01",
  "layer-selected-hover": "layer-selected-hover-01",
  field: "field-01",
  "field-hover": "field-hover-01",
  "border-strong": "border-strong-01",
  "border-subtle": "border-subtle-00",
  "border-subtle-selected": "border-subtle-selected-01",
  "border-tile": "border-tile-01",
};

const CONTEXTUAL_TOKENS = new Set(Object.keys(CONTEXTUAL));
const COMPONENT_TOKENS = new Set(Object.keys(componentTokens));

/**
 * The tokens `Theme`'s Sass map has no key for: the contextual ones. Carbon
 * computes them from the numbered tokens.
 * @param {string} token
 */
function isContextual(token) {
  return CONTEXTUAL_TOKENS.has(token);
}

/**
 * Apply overrides to a base theme.
 *
 * With `derive`, each token that Carbon steps from another (hover, active,
 * selected, a brand's links and borders) follows an overridden source unless
 * the user set it. The result holds only tokens whose value differs from the
 * base theme.
 * @param {CarbonTheme} theme
 * @param {TokenMap} overrides
 * @param {{ derive?: boolean }} [options]
 * @returns {{ tokens: TokenMap; sources: Record<string, TokenSource> }}
 */
export function resolveTheme(theme, overrides, options = {}) {
  const { derive: follow = true } = options;
  /** @type {TokenMap} */
  const tokens = {};
  /** @type {Record<string, TokenSource>} */
  const sources = {};
  const explicit = sanitizeTokens(overrides).tokens;
  for (const [token, value] of Object.entries(explicit)) {
    tokens[token] = value;
    sources[token] = "override";
  }

  if (follow) {
    for (const { token, from, themes } of DERIVATIONS) {
      if (sources[token] === "override" || !(from in tokens)) continue;
      if (themes && !themes.includes(theme)) continue;
      const base = baseValue(theme, from);
      const target = baseValue(theme, token);
      if (!base || !target) continue;
      const value = deriveColor(tokens[from], base, target);
      if (value) {
        tokens[token] = value;
        sources[token] = "derived";
      }
    }
  }

  for (const [alias, numbered] of Object.entries(CONTEXTUAL)) {
    if (sources[alias] === "override" || !(numbered in tokens)) continue;
    if (baseValue(theme, alias) !== baseValue(theme, numbered)) continue;
    tokens[alias] = tokens[numbered];
    sources[alias] = "alias";
  }

  for (const token of Object.keys(tokens)) {
    if (tokens[token] === baseValue(theme, token)?.toLowerCase()) {
      delete tokens[token];
      delete sources[token];
    }
  }
  return { tokens, sources };
}

/**
 * @param {TokenMap} a
 * @param {TokenMap} b
 */
function sameTokens(a, b) {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k])
  );
}

/**
 * Drop each override that resolution would reproduce without it, so an
 * imported export (every derived token written out) comes back as the few
 * tokens a person set. The resolved theme stays the same.
 * @param {CarbonTheme} theme
 * @param {TokenMap} overrides
 * @param {boolean} [follow]
 * @returns {TokenMap}
 */
export function minimizeOverrides(theme, overrides, follow = true) {
  const kept = { ...sanitizeTokens(overrides).tokens };
  const target = resolveTheme(theme, kept, { derive: follow }).tokens;
  for (const token of Object.keys(kept).reverse()) {
    const { [token]: removed, ...rest } = kept;
    if (
      sameTokens(resolveTheme(theme, rest, { derive: follow }).tokens, target)
    ) {
      delete kept[token];
    }
  }
  return kept;
}

/**
 * Every token of the base theme with the resolved changes on top.
 * @param {CarbonTheme} theme
 * @param {TokenMap} changed
 * @returns {TokenMap}
 */
export function fullTheme(theme, changed) {
  /** @type {TokenMap} */
  const all = {};
  for (const token of TOKEN_NAMES) all[token] = TOKENS[token][theme];
  return Object.assign(all, changed);
}

/**
 * The color a token shows, following `var(--cds-x)` aliases.
 * @param {TokenMap} all
 * @param {string} token
 * @returns {string | undefined}
 */
function colorOf(all, token) {
  let value = all[token];
  for (let hops = 0; value && hops < 4; hops++) {
    const next = VAR.exec(value)?.[1];
    if (!next) return value;
    value = all[next];
  }
  return undefined;
}

/**
 * Inline `style` text for an element that previews the theme.
 * @param {TokenMap} changed
 * @returns {string}
 */
export function previewStyle(changed) {
  return Object.entries(sanitizeTokens(changed).tokens)
    .map(([token, value]) => `--cds-${token}:${value}`)
    .join(";");
}

// ---------------------------------------------------------------------------
// Contrast

/**
 * @typedef {{ fg: string; bg: string; min: number; use: "text" | "ui" }} ContrastPair
 */

/** @type {ContrastPair[]} */
const PAIRS = [];

/**
 * @param {string} fg
 * @param {string[]} bgs
 * @param {"text" | "ui"} use
 */
function pairs(fg, bgs, use) {
  for (const bg of bgs)
    PAIRS.push({ fg, bg, min: use === "text" ? 4.5 : 3, use });
}

const SURFACES = ["background", "layer-01", "layer-02", "layer-03"];
const FIELDS = ["field-01", "field-02", "field-03"];

// Text, 4.5:1 (WCAG 1.4.3).
pairs(
  "text-primary",
  [...SURFACES, ...FIELDS, "layer-hover-01", "layer-selected-01"],
  "text",
);
pairs("text-secondary", [...SURFACES, "field-01"], "text");
pairs("text-helper", ["background", "layer-01", "field-01"], "text");
pairs("text-placeholder", FIELDS, "text");
pairs("text-error", ["background", "layer-01", "field-01"], "text");
pairs("text-inverse", ["background-inverse"], "text");
pairs(
  "text-on-color",
  [
    "button-primary",
    "button-primary-hover",
    "button-primary-active",
    "button-secondary",
    "button-danger-primary",
    "background-brand",
  ],
  "text",
);
pairs("link-primary", ["background", "layer-01", "layer-02"], "text");
pairs("link-primary-hover", ["background"], "text");
pairs("link-secondary", ["background"], "text");
pairs("link-visited", ["background"], "text");
pairs("link-inverse", ["background-inverse"], "text");
pairs("button-tertiary", ["background"], "text");
for (const color of [
  "red",
  "magenta",
  "purple",
  "blue",
  "cyan",
  "teal",
  "green",
  "gray",
  "cool-gray",
  "warm-gray",
]) {
  pairs(`tag-color-${color}`, [`tag-background-${color}`], "text");
}
pairs(
  "text-primary",
  [
    "notification-background-error",
    "notification-background-success",
    "notification-background-info",
    "notification-background-warning",
  ],
  "text",
);

// Icons, borders, focus, and status colors, 3:1 (WCAG 1.4.11 and 2.4.11).
pairs("icon-primary", ["background", "layer-01"], "ui");
pairs("icon-secondary", ["background", "layer-01"], "ui");
pairs("icon-interactive", ["background"], "ui");
pairs("icon-on-color", ["button-primary"], "ui");
pairs("focus", [...SURFACES, "field-01"], "ui");
pairs("focus-inverse", ["background-inverse"], "ui");
pairs("border-strong-01", ["background", "field-01"], "ui");
pairs("border-interactive", ["background"], "ui");
pairs("toggle-off", ["background"], "ui");
pairs("support-error", ["background", "layer-01"], "ui");
pairs("support-success", ["background"], "ui");
pairs("support-warning", ["background"], "ui");
pairs("support-info", ["background"], "ui");

/**
 * The token pairs that Carbon components put on top of each other. Text pairs
 * need 4.5:1 and non-text pairs 3:1, the WCAG 2.2 AA minimums.
 * @type {readonly ContrastPair[]}
 */
export const CONTRAST_PAIRS = PAIRS;

/**
 * @typedef {{
 *   fg: string;
 *   bg: string;
 *   use: "text" | "ui";
 *   min: number;
 *   ratio: number;
 *   baseRatio: number;
 *   lc: number;
 *   status: "pass" | "fail" | "base-fail";
 * }} ContrastResult
 * `status` is `"fail"` when the pair is below its minimum and the overrides
 * did not already leave it that way; `"base-fail"` when it is below the
 * minimum in the base theme too, for Carbon's own values.
 */

/**
 * Measure every pair in `CONTRAST_PAIRS`. A pair with a color that is not an
 * RGB color is left out.
 * @param {CarbonTheme} theme
 * @param {TokenMap} changed
 * @returns {ContrastResult[]}
 */
export function checkContrast(theme, changed) {
  const now = fullTheme(theme, changed);
  const before = fullTheme(theme, {});
  /** @type {ContrastResult[]} */
  const results = [];
  for (const { fg, bg, min, use } of PAIRS) {
    const a = parseColor(colorOf(now, fg) ?? "");
    const b = parseColor(colorOf(now, bg) ?? "");
    const a0 = parseColor(colorOf(before, fg) ?? "");
    const b0 = parseColor(colorOf(before, bg) ?? "");
    if (!a || !b || !a0 || !b0) continue;
    const ratio = contrast(a, b);
    const baseRatio = contrast(a0, b0);
    const below = ratio < min - 0.005;
    const baseBelow = baseRatio < min - 0.005;
    results.push({
      fg,
      bg,
      use,
      min,
      ratio,
      baseRatio,
      lc: apca(a, b),
      status: below
        ? baseBelow && ratio >= baseRatio - 0.005
          ? "base-fail"
          : "fail"
        : "pass",
    });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Export

const SELECTOR = /^[\w\s.#:[\]="'>+~*,()-]{1,120}$/;

/**
 * A CSS selector from user input, or `:root` when it is empty or holds
 * anything that could end the rule.
 * @param {string | undefined} selector
 */
function safeSelector(selector) {
  const text = (selector ?? "").trim();
  return SELECTOR.test(text) ? text : ":root";
}

/**
 * The resolved tokens as CSS custom properties.
 * @param {TokenMap} changed
 * @param {{ selector?: string }} [options]
 */
export function toCss(changed, options = {}) {
  const lines = Object.entries(sanitizeTokens(changed).tokens).map(
    ([token, value]) => `  --cds-${token}: ${value};`,
  );
  return `${safeSelector(options.selector)} {\n${lines.join("\n")}\n}\n`;
}

/**
 * The resolved tokens for Carbon's Sass: a `$theme` map for the core tokens,
 * and a second map for the component tokens (`button-*`, `tag-*`), which
 * Carbon keeps outside the theme map. Carbon has no Gray 80 theme, so that
 * base falls back to Gray 90 and lists every difference from it.
 * @param {CarbonTheme} theme
 * @param {TokenMap} changed
 */
export function toScss(theme, changed) {
  const fallback = theme === "g80" ? "g90" : theme;
  const all = fullTheme(theme, sanitizeTokens(changed).tokens);
  /** @type {TokenMap} */
  const core = {};
  /** @type {TokenMap} */
  const component = {};
  for (const token of TOKEN_NAMES) {
    if (isContextual(token)) continue;
    if (all[token].toLowerCase() === TOKENS[token][fallback].toLowerCase())
      continue;
    (COMPONENT_TOKENS.has(token) ? component : core)[token] = all[token];
  }
  /** @param {TokenMap} map */
  const body = (map) =>
    Object.entries(map)
      .map(([token, value]) => `    ${token}: ${value},`)
      .join("\n");
  const lines = [
    '@use "@carbon/styles/scss/themes";',
    `@use "@carbon/styles/scss/theme" with (`,
    `  $fallback: themes.$${fallback},`,
    "  $theme: (",
    body(core),
    "  )",
    ");",
  ];
  if (Object.keys(component).length > 0) {
    lines.push(
      "",
      "// Component tokens are not part of the theme map. Pass them to the",
      "// theme mixin where you emit the custom properties.",
      "$component-tokens: (",
      body(component).replace(LEADING_INDENT, ""),
      ");",
      "",
      ":root {",
      "  @include theme.theme(theme.$theme, $component-tokens);",
      "}",
    );
  }
  return `${lines.join("\n")}\n`;
}

/**
 * `#rrggbb` or `#rrggbbaa`, or a `{token}` alias, the way a Design Tokens
 * Community Group file writes a color.
 * @param {string} value
 */
function toDtcgColor(value) {
  const alias = VAR.exec(value)?.[1];
  if (alias) return `{${alias}}`;
  const color = parseColor(value);
  return color ? formatHex(color) : value;
}

/**
 * The resolved tokens as a Design Tokens Community Group file in the shape of
 * `carbon-components-svelte/tokens.json`: a token set, `$themes`, and
 * `$metadata`. The set is `overrides`; the theme lists the base theme's set as
 * `"source"`, so a tool that loads both resolves aliases.
 * @param {CarbonTheme} theme
 * @param {TokenMap} changed
 */
export function toDtcg(theme, changed) {
  const set = Object.fromEntries(
    Object.entries(sanitizeTokens(changed).tokens).map(([token, value]) => [
      token,
      { $type: "color", $value: toDtcgColor(value) },
    ]),
  );
  return {
    overrides: set,
    $themes: [
      {
        id: "custom",
        name: "Custom",
        selectedTokenSets: { [theme]: "source", overrides: "enabled" },
      },
    ],
    $metadata: { tokenSetOrder: [theme, "overrides"] },
    $extensions: { "carbon-components-svelte": { base: theme } },
  };
}

// ---------------------------------------------------------------------------
// Import

const DECLARATION = /--cds-([a-z0-9-]+)\s*:\s*([^;}]+?)\s*(?:;|}|$)/gi;
const ALIAS = /^\{([a-z0-9-]+)\}$/i;

/** @param {unknown} value */
function fromDtcgValue(value) {
  if (typeof value !== "string") return value;
  const alias = ALIAS.exec(value.trim())?.[1];
  return alias ? `var(--cds-${alias})` : value;
}

/**
 * The values of a token set, whether each entry is a bare value or a DTCG
 * token with `$value`. Nothing is validated here.
 * @param {unknown} node
 * @returns {Record<string, unknown>}
 */
function readSet(node) {
  /** @type {Record<string, unknown>} */
  const out = {};
  if (!node || typeof node !== "object") return out;
  for (const [token, entry] of Object.entries(node)) {
    if (token.startsWith("$")) continue;
    out[token] = fromDtcgValue(
      entry && typeof entry === "object"
        ? /** @type {{ $value?: unknown }} */ (entry).$value
        : entry,
    );
  }
  return out;
}

/**
 * Read a theme from text: CSS custom properties, a flat `{ token: value }`
 * object, `{ base, tokens }`, or a Design Tokens Community Group file such as
 * this builder's export or `carbon-components-svelte/tokens.json`. Entries
 * that name no token or hold an unsafe value come back in `invalid`.
 *
 * A full DTCG theme set (`white`, `g100`) sets `base`, and its `tokens` are
 * only the values that differ from that theme.
 * @param {string} text
 * @returns {{ base?: CarbonTheme; tokens: TokenMap; invalid: string[] }}
 */
export function parseTheme(text) {
  const source = String(text).trim();
  /** @type {unknown} */
  let json;
  try {
    json = JSON.parse(source);
  } catch {
    json = undefined;
  }

  if (json && typeof json === "object" && !Array.isArray(json)) {
    const doc = /** @type {Record<string, any>} */ (json);
    const declared = doc.$extensions?.["carbon-components-svelte"]?.base;
    /** @type {CarbonTheme | undefined} */
    let base = isTheme(declared) ? declared : undefined;
    /** @type {unknown} */
    let raw;
    if (doc.overrides && typeof doc.overrides === "object") {
      raw = readSet(doc.overrides);
    } else if (typeof doc.base === "string" && doc.tokens) {
      if (isTheme(doc.base)) base = doc.base;
      raw = readSet(doc.tokens);
    } else if (THEME_NAMES.some((name) => name in doc)) {
      base = THEME_NAMES.find((name) => name in doc);
      raw = readSet(doc[/** @type {string} */ (base)]);
    } else {
      raw = readSet(doc);
    }
    const { tokens, invalid } = sanitizeTokens(raw);
    if (base) {
      for (const [token, value] of Object.entries(tokens)) {
        if (value === baseValue(base, token)?.toLowerCase())
          delete tokens[token];
      }
    }
    return { base, tokens, invalid };
  }

  /** @type {Record<string, string>} */
  const found = {};
  for (const match of source.matchAll(DECLARATION)) {
    found[match[1].toLowerCase()] = match[2];
  }
  const { tokens, invalid } = sanitizeTokens(found);
  if (Object.keys(found).length === 0 && source)
    invalid.push("(no tokens found)");
  return { tokens, invalid };
}

// ---------------------------------------------------------------------------
// Share link

const LEADING_INDENT = /^ {2}/gm;
const HASH_PREFIX = /^#/;
const HEX_BARE = /^[0-9a-f]{3,8}$/i;

/**
 * Encode a theme for a URL hash: `b=g100&interactive=8a3ffc`. A hex color
 * drops its `#`.
 * @param {CarbonTheme} theme
 * @param {TokenMap} overrides
 */
export function encodeShare(theme, overrides) {
  const params = new URLSearchParams({ b: theme });
  for (const [token, value] of Object.entries(
    sanitizeTokens(overrides).tokens,
  )) {
    params.set(token, value.startsWith("#") ? value.slice(1) : value);
  }
  return params.toString();
}

/**
 * Read what `encodeShare` wrote, with or without the leading `#`. Unknown
 * tokens and unsafe values are dropped.
 * @param {string} hash
 * @returns {{ base: CarbonTheme; tokens: TokenMap } | null} `null` when the
 * hash holds no theme.
 */
export function decodeShare(hash) {
  const params = new URLSearchParams(hash.replace(HASH_PREFIX, ""));
  const b = params.get("b");
  if (!b || !isTheme(b)) return null;
  /** @type {Record<string, string>} */
  const raw = {};
  for (const [token, value] of params) {
    if (token === "b") continue;
    raw[token] = HEX_BARE.test(value) ? `#${value}` : value;
  }
  return { base: b, tokens: sanitizeTokens(raw).tokens };
}
