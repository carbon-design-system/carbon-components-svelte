// @ts-check
import { getContext } from "svelte";
import { derived, readable } from "svelte/store";
import { THEME_ZONE_CONTEXT_KEY } from "../constants/context-keys.js";

/**
 * The class that gives an element a theme's full token set in `all.css`.
 * Spelled out, not built from the theme name, so each class is greppable.
 * @type {Record<import("../Theme/Theme.svelte").CarbonTheme | "system", string>}
 */
export const themeZoneClasses = {
  white: "bx--white",
  g10: "bx--g10",
  g80: "bx--g80",
  g90: "bx--g90",
  g100: "bx--g100",
  system: "bx--system",
};

/**
 * The theme class of the nearest `ThemeZone`, for content a component
 * portals out of it. `undefined` outside a zone. Call during component
 * initialization.
 * @returns {import("svelte/store").Readable<string | undefined>}
 */
export function getThemeZoneClass() {
  /** @type {import("svelte/store").Readable<keyof typeof themeZoneClasses> | undefined} */
  const zone = getContext(THEME_ZONE_CONTEXT_KEY);
  if (!zone) return readable(undefined);
  return derived(zone, (theme) => themeZoneClasses[theme]);
}
