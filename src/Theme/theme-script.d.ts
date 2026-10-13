import type { CarbonTheme, CarbonToken } from "./Theme.svelte";

export interface ThemeScriptOptions {
  /** Theme to apply when no stored or system theme applies. */
  theme?: CarbonTheme;
  /** Tokens to set as `--cds-{token}`, matching `Theme`'s `tokens`. */
  tokens?: Partial<Record<CarbonToken, string>>;
  /** Read a theme stored by `Theme` with `persist`. */
  persist?: boolean;
  /** Local storage key, matching `Theme`'s `persistKey`. */
  persistKey?: string;
  /** Pick the theme from the operating system color scheme. */
  system?: boolean;
  /** Themes for the light and dark system color schemes. */
  systemThemes?: [light: CarbonTheme, dark: CarbonTheme];
}

/**
 * Build a script that applies the theme to `<html>` before first paint.
 * Pass the same options as `Theme` so both resolve the same theme:
 * with `system`, the color scheme picks from `systemThemes`; otherwise
 * with `persist`, a stored theme under `persistKey` wins over `theme`.
 * `tokens` are set as `--cds-{token}`, as `Theme` sets them.
 * Returns the script body without `<script>` tags.
 */
export function themeScript(options?: ThemeScriptOptions): string;
