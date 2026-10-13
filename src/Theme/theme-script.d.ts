type CarbonTheme = "white" | "g10" | "g80" | "g90" | "g100";

export interface ThemeScriptOptions {
  /** Theme to apply when no stored or system theme applies. */
  theme?: CarbonTheme;
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
 * Returns the script body without `<script>` tags.
 */
export function themeScript(options?: ThemeScriptOptions): string;
