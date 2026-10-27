// @ts-check
import { getContext, setContext } from "svelte";

// Read only by the Kbd family, through `getKbdTranslations`.
const KBD_TRANSLATIONS_CONTEXT_KEY = "carbon:KbdTranslations";

/**
 * Translate the key names of every `Kbd` in this component and below it,
 * including the keys a Button, Search, HeaderSearch or menu item shows for
 * its `shortcut`. Pass the translations by id, or a function; a key left
 * out, or `undefined` from the function, keeps its English name. A `Kbd`'s
 * own `translateWithId` takes precedence. Call during component
 * initialization, such as in the app's root layout.
 * @param {Partial<Record<import("./Kbd.svelte").KbdTranslationId, string>> | ((id: import("./Kbd.svelte").KbdTranslationId) => string | undefined)} translations
 * @example
 * setKbdTranslations({ ctrl: "Strg", shift: "Umschalt" });
 */
export function setKbdTranslations(translations) {
  setContext(
    KBD_TRANSLATIONS_CONTEXT_KEY,
    typeof translations === "function"
      ? translations
      : (/** @type {import("./Kbd.svelte").KbdTranslationId} */ id) =>
          translations[id],
  );
}

/**
 * The translations set by the nearest `setKbdTranslations`, if any.
 * @returns {undefined | ((id: import("./Kbd.svelte").KbdTranslationId) => string | undefined)}
 */
export function getKbdTranslations() {
  return getContext(KBD_TRANSLATIONS_CONTEXT_KEY);
}
