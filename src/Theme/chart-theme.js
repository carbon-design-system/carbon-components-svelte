// @ts-check
import { getContext } from "svelte";
import { derived, readable } from "svelte/store";
import { THEME_ZONE_CONTEXT_KEY } from "../constants/context-keys.js";

/** @typedef {import("./chart-theme.js").ChartTheme} ChartTheme */

/**
 * Map a Carbon theme to the `theme` option of Carbon Charts.
 * @param {string | null | undefined} theme
 * @returns {ChartTheme}
 */
export function toChartTheme(theme) {
  switch (theme) {
    case "g10":
    case "g90":
    case "g100":
      return theme;
    // Charts has no Gray 80, and it renders a theme it doesn't know as
    // White. Gray 90 is the nearest dark theme.
    case "g80":
      return "g90";
    default:
      return "white";
  }
}

// One observer for every subscriber. `Theme` and `themeScript` set the page
// theme as the `theme` attribute on `<html>`.
const pageTheme = readable(/** @type {string | null} */ (null), (set) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  set(root.getAttribute("theme"));
  const observer = new MutationObserver(() => {
    set(root.getAttribute("theme"));
  });
  observer.observe(root, { attributes: true, attributeFilter: ["theme"] });
  return () => observer.disconnect();
});

/**
 * A store of the Carbon Charts theme for the nearest `ThemeZone`, or for the
 * page theme outside a zone. Call during component initialization.
 * @returns {import("svelte/store").Readable<ChartTheme>}
 */
export function getChartTheme() {
  /** @type {import("svelte/store").Readable<string> | undefined} */
  const zone = getContext(THEME_ZONE_CONTEXT_KEY);
  return derived(zone ?? pageTheme, toChartTheme);
}
