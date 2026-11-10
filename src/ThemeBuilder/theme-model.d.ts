import type { CarbonTheme } from "../Theme/Theme.svelte";

/** Token name to CSS color. */
export type TokenMap = Record<string, string>;

/**
 * How a token got its value: typed by the user, derived from another token,
 * or following a numbered token (`layer` for `layer-01`).
 */
export type TokenSource = "override" | "derived" | "alias";

export const THEME_NAMES: readonly ["white", "g10", "g80", "g90", "g100"];

/** Every token the builder edits, in the order `all.css` declares them. */
export const TOKEN_NAMES: string[];

export function isToken(name: string): boolean;
export function isTheme(name: unknown): name is CarbonTheme;

/** The value a token has in a base theme. */
export function baseValue(
  theme: CarbonTheme,
  token: string,
): string | undefined;

export interface TokenGroup {
  id: string;
  label: string;
  description: string;
}

export const TOKEN_GROUPS: readonly TokenGroup[];

/** The group a token is edited in. */
export function groupOf(token: string): string;

/** Tokens by group, in `all.css` order. */
export function tokensByGroup(): Record<string, string[]>;

/**
 * Accept `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, or
 * `var(--cds-token)`, lowercased. Anything else returns `null`.
 */
export function normalizeValue(value: unknown): string | null;

/** Keep the entries that name a token and hold a safe value. */
export function sanitizeTokens(input: unknown): {
  tokens: TokenMap;
  invalid: string[];
};

/**
 * Move `source` by the step Carbon takes from `baseSource` to `baseTarget`,
 * in OKLCH. Returns `#rrggbb`, or `null` for a translucent color.
 */
export function deriveColor(
  source: string,
  baseSource: string,
  baseTarget: string,
): string | null;

export interface Derivation {
  token: string;
  from: string;
  themes?: readonly CarbonTheme[];
}

/** `token` follows `from` unless the user sets it. Listed source first. */
export const DERIVATIONS: readonly Derivation[];

/** Contextual tokens and the numbered token each one is in the first layer. */
export const CONTEXTUAL: Readonly<Record<string, string>>;

/** Apply overrides to a base theme. Only changed tokens are returned. */
export function resolveTheme(
  theme: CarbonTheme,
  overrides: TokenMap,
  options?: { derive?: boolean },
): { tokens: TokenMap; sources: Record<string, TokenSource> };

/** Drop each override that resolution would reproduce without it. */
export function minimizeOverrides(
  theme: CarbonTheme,
  overrides: TokenMap,
  follow?: boolean,
): TokenMap;

/** Every token of the base theme with the resolved changes on top. */
export function fullTheme(theme: CarbonTheme, changed: TokenMap): TokenMap;

/** Inline `style` text for an element that previews the theme. */
export function previewStyle(changed: TokenMap): string;

export interface ContrastPair {
  fg: string;
  bg: string;
  min: number;
  use: "text" | "ui";
}

/** The token pairs that Carbon components put on top of each other. */
export const CONTRAST_PAIRS: readonly ContrastPair[];

export interface ContrastResult {
  fg: string;
  bg: string;
  use: "text" | "ui";
  min: number;
  ratio: number;
  baseRatio: number;
  lc: number;
  /**
   * `"fail"` is below the minimum and not already so in the base theme;
   * `"base-fail"` is below it in the base theme too.
   */
  status: "pass" | "fail" | "base-fail";
}

export function checkContrast(
  theme: CarbonTheme,
  changed: TokenMap,
): ContrastResult[];

export function toCss(
  changed: TokenMap,
  options?: { selector?: string },
): string;
export function toScss(theme: CarbonTheme, changed: TokenMap): string;

export interface DtcgToken {
  $type: "color";
  $value: string;
}

export function toDtcg(
  theme: CarbonTheme,
  changed: TokenMap,
): {
  overrides: Record<string, DtcgToken>;
  $themes: {
    id: string;
    name: string;
    selectedTokenSets: Record<string, "source" | "enabled">;
  }[];
  $metadata: { tokenSetOrder: string[] };
  $extensions: { "carbon-components-svelte": { base: CarbonTheme } };
};

/** Read CSS custom properties, a token map, or Design Tokens JSON. */
export function parseTheme(text: string): {
  base?: CarbonTheme;
  tokens: TokenMap;
  invalid: string[];
};

export function encodeShare(theme: CarbonTheme, overrides: TokenMap): string;

export function decodeShare(
  hash: string,
): { base: CarbonTheme; tokens: TokenMap } | null;
