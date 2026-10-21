import type { CarbonTheme, CarbonToken } from "./Theme.svelte";

export interface CreateThemeOptions {
  /**
   * Base theme the tokens are for. Dark themes pair lighter link and
   * interactive colors with the brand.
   * @default "white"
   */
  theme?: CarbonTheme;
  /** Brand color as `#rgb` or `#rrggbb`. It becomes `button-primary`. */
  brand: string;
  /**
   * Tokens to set as given. They win over derived tokens; set one to
   * `undefined` to keep the base theme's value.
   */
  tokens?: Partial<Record<CarbonToken, string>>;
}

export interface ContrastWarning {
  /** Text or indicator token, for example `"text-on-color"`. */
  foreground: CarbonToken;
  /** Token behind it, for example `"button-primary"`. */
  background: CarbonToken;
  /** Contrast ratio, rounded down to two decimals. */
  ratio: number;
  /** WCAG AA minimum: 4.5 for text, 3 for focus. */
  minimum: number;
  /** Sentence naming both tokens, their values, and the ratios. */
  message: string;
}

export interface CreateThemeResult {
  /** The base theme. Pass it to `Theme` with `tokens`. */
  theme: CarbonTheme;
  /** Derived tokens and overrides, for `Theme`'s `tokens` or `themeScript`. */
  tokens: Partial<Record<CarbonToken, string>>;
  /** Pairs below WCAG AA. Empty when every check passes. */
  warnings: ContrastWarning[];
  /**
   * The tokens as a CSS rule of `--cds-{token}` properties. The default
   * selector, `:root[theme="{theme}"]`, applies only while the base theme is
   * active. Load the rule after `all.css`.
   */
  css(selector?: string): string;
}

/**
 * Build theme tokens from a brand color. The brand becomes `button-primary`,
 * and the tokens Carbon pairs with it (hover and active states, interactive
 * borders, focus, links, `background-brand`) are derived the way Carbon
 * derives them from blue 60 for the base `theme`. A Carbon palette color
 * uses Carbon's own steps; any other color keeps its hue and matches the
 * luminance of Carbon's steps, so contrast carries over.
 *
 * `warnings` lists pairs below WCAG AA: `text-on-color` on `button-primary`
 * and `link-primary` on `background` (4.5:1), and `focus` on `background`
 * (3:1). Throws a `TypeError` for an unknown theme or a brand that is not a
 * hex color.
 *
 * @example
 * const { tokens, warnings } = createTheme({ theme: "g100", brand: "#d02670" });
 * // <Theme theme="g100" {tokens} />
 */
export function createTheme(options: CreateThemeOptions): CreateThemeResult;
