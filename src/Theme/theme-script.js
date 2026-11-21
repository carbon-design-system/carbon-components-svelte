// @ts-check

import { withContextualTokens } from "./contextual-tokens.js";

/** @typedef {"white" | "g10" | "g80" | "g90" | "g100"} CarbonTheme */

const THEMES = ["white", "g10", "g80", "g90", "g100"];

/**
 * JSON for an inline `<script>`: `<` is escaped so a value cannot close the tag.
 * @param {unknown} value
 */
function inline(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/**
 * Build a script that applies the theme to `<html>` before first paint.
 * Pass the same options as `Theme` so both resolve the same theme:
 * with `system`, the color scheme picks from `systemThemes`; otherwise
 * with `persist`, a stored theme under `persistKey` wins over `theme`.
 * With `system: "fallback"`, a stored theme wins over the color scheme.
 * `tokens` are set as `--cds-{token}`, as `Theme` sets them.
 * Returns the script body without `<script>` tags.
 * @param {{ theme?: CarbonTheme; tokens?: Record<string, string>; persist?: boolean; persistKey?: string; system?: boolean | "fallback"; systemThemes?: [light: CarbonTheme, dark: CarbonTheme] }} [options]
 * @returns {string}
 * @example
 * const script = `<script>${themeScript({ persist: true, system: true })}</script>`;
 */
export function themeScript(options = {}) {
  const {
    theme = "white",
    tokens = {},
    persist = false,
    persistKey = "theme",
    system = false,
    systemThemes = ["white", "g100"],
  } = options;

  const key = persist ? inline(persistKey) : "null";
  const pair = system ? inline(systemThemes) : "null";
  const fallback = system === "fallback" ? "1" : "0";
  const custom = Object.entries(withContextualTokens(tokens))
    .map(
      ([token, value]) =>
        `d.style.setProperty(${inline(`--cds-${token}`)},${inline(value)});`,
    )
    .join("");

  return `(()=>{let t=${inline(theme)},v;const k=${key},s=${pair};if(k)try{v=localStorage.getItem(k);try{v=JSON.parse(v)}catch{}}catch{}const p=${inline(THEMES)}.includes(v);if(s&&!(${fallback}&&p)&&window.matchMedia)t=s[+matchMedia("(prefers-color-scheme: dark)").matches];else if(p)t=v;const d=document.documentElement;d.setAttribute("theme",t);d.style.setProperty("color-scheme",t==="white"||t==="g10"?"light":"dark");${custom}})()`;
}
