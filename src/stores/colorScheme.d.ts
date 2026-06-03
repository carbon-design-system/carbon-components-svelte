import type { Readable } from "svelte/store";

/** Chosen color-scheme preference. */
export type ColorSchemePreference = "system" | "light" | "dark";

/** Concrete scheme after resolving `"system"`. */
export type ResolvedColorScheme = "light" | "dark";

export interface ColorSchemeValue {
  preference: ColorSchemePreference;
  resolved: ResolvedColorScheme;
}

export interface ColorSchemeStore extends Readable<ColorSchemeValue> {
  /** Set and persist the color-scheme preference. */
  set(value: ColorSchemePreference): void;
}

export interface ColorSchemeOptions {
  /** Preference used when nothing is stored. Defaults to `"system"`. */
  initialValue?: ColorSchemePreference;
  /** Storage key. Defaults to `"color-scheme"`. */
  key?: string;
  /** Storage backend. Defaults to `"localStorage"`. */
  storage?: "localStorage" | "sessionStorage";
}

/**
 * Headless color-scheme preference store, the store counterpart to the `Theme`
 * component. Tracks the chosen preference, persists it with `safeBrowserStorage`,
 * and resolves `"system"` to a concrete `"light" | "dark"` through `prefersDarkMode`.
 */
export function colorScheme(options?: ColorSchemeOptions): ColorSchemeStore;

export default colorScheme;
