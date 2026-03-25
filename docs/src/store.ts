import type { CarbonTheme } from "carbon-components-svelte/src/Theme/Theme.svelte";
import { writable } from "svelte/store";

const VALID_THEMES: readonly CarbonTheme[] = [
  "white",
  "g10",
  "g80",
  "g90",
  "g100",
];

const DEFAULT_THEME: CarbonTheme = "white";

function readStoredTheme(): CarbonTheme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem("theme");
    if (stored !== null && VALID_THEMES.includes(stored as CarbonTheme)) {
      return stored as CarbonTheme;
    }
  } catch {}
  return DEFAULT_THEME;
}

export const theme = writable<CarbonTheme>(readStoredTheme());
