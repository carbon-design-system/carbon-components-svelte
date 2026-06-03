// @ts-check
import { derived, writable } from "svelte/store";
import { safeBrowserStorage } from "../utils/storage.js";
import { prefersDarkMode } from "./prefersDarkMode.js";

/** @typedef {"system" | "light" | "dark"} ColorSchemePreference */
/** @typedef {"light" | "dark"} ResolvedColorScheme */

/**
 * @param {unknown} value
 * @returns {value is ColorSchemePreference}
 */
function isPreference(value) {
  return value === "system" || value === "light" || value === "dark";
}

/**
 * Headless color-scheme preference store, the store counterpart to the `Theme`
 * component. Tracks the chosen preference (`"system" | "light" | "dark"`),
 * persists it with {@link safeBrowserStorage}, and resolves `"system"` to a
 * concrete `"light" | "dark"` through {@link prefersDarkMode}.
 *
 * The store value is `{ preference, resolved }`. Call `set` to change and
 * persist the preference.
 *
 * @param {object} [options]
 * @param {ColorSchemePreference} [options.initialValue="system"] - Preference used when nothing is stored.
 * @param {string} [options.key="color-scheme"] - Storage key.
 * @param {"localStorage" | "sessionStorage"} [options.storage="localStorage"] - Storage backend.
 */
export function colorScheme(options = {}) {
  const {
    initialValue = "system",
    key = "color-scheme",
    storage = "localStorage",
  } = options;

  const store = safeBrowserStorage(storage);
  const stored = store.getItem(key);
  const preference = writable(
    /** @type {ColorSchemePreference} */ (
      isPreference(stored) ? stored : initialValue
    ),
  );

  const { subscribe } = derived(
    [preference, prefersDarkMode],
    ([$preference, $prefersDark]) => ({
      preference: $preference,
      resolved: /** @type {ResolvedColorScheme} */ (
        $preference === "system"
          ? $prefersDark
            ? "dark"
            : "light"
          : $preference
      ),
    }),
  );

  return {
    subscribe,
    /**
     * Set and persist the color-scheme preference.
     * @param {ColorSchemePreference} value
     */
    set(value) {
      preference.set(value);
      store.setItem(key, value);
    },
  };
}

export default colorScheme;
