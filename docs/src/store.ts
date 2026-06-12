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

export const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

const DEFAULT_PACKAGE_MANAGER_INDEX = 0;

function readStoredPackageManagerIndex(): number {
  if (typeof window === "undefined") return DEFAULT_PACKAGE_MANAGER_INDEX;
  try {
    const stored = localStorage.getItem("packageManager");
    if (stored !== null) {
      const index = PACKAGE_MANAGERS.indexOf(stored as PackageManager);
      if (index >= 0) return index;
    }
  } catch {}
  return DEFAULT_PACKAGE_MANAGER_INDEX;
}

function readStoredComponentTocOpen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem("componentTocOpen");
    if (stored === "false") return false;
    if (stored === "true") return true;
  } catch {}
  return true;
}

export const packageManagerIndex = writable<number>(
  readStoredPackageManagerIndex(),
);

export const componentTocOpen = writable<boolean>(readStoredComponentTocOpen());

if (typeof window !== "undefined") {
  packageManagerIndex.subscribe((index) => {
    const manager = PACKAGE_MANAGERS[index];
    if (manager) localStorage.setItem("packageManager", manager);
  });

  componentTocOpen.subscribe((open) => {
    try {
      localStorage.setItem("componentTocOpen", String(open));
    } catch {}
  });
}
