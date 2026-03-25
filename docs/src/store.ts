import type { CarbonTheme } from "carbon-components-svelte/src/Theme/Theme.svelte";
import { writable } from "svelte/store";

const VALID_THEMES: readonly CarbonTheme[] = [
  "white",
  "g10",
  "g80",
  "g90",
  "g100",
];

function readStoredTheme(): CarbonTheme {
  if (typeof window === "undefined") return "white";
  try {
    const stored = localStorage.getItem("theme");
    if (stored !== null && VALID_THEMES.includes(stored as CarbonTheme)) {
      return stored as CarbonTheme;
    }
  } catch {
    // ignore
  }
  return "white";
}

export const theme = writable<CarbonTheme>(readStoredTheme());
