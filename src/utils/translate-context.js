// @ts-check
import { getContext, setContext } from "svelte";
import { TRANSLATE_CONTEXT_KEY } from "../constants/context-keys.js";

/**
 * Translate the built-in strings of every component in this component and
 * below it that takes a `translateWithId` prop: Dropdown, ComboBox,
 * MultiSelect, NumberInput, DataTable, StructuredListCell and the like.
 * `translateWithId` receives the id of a string, such as `"increment"`, and
 * returns its translation. Return `undefined` for an id to keep its
 * English text. A component's own `translateWithId` prop takes precedence,
 * and a `Kbd` also prefers `setKbdTranslations`. Ids are shared by all
 * components, so one function covers an app; the ids are listed in the
 * string table. Call during component initialization, such as in the app's
 * root layout.
 * @param {(id: string) => string | undefined} translateWithId
 * @example
 * setTranslateContext((id) => messages[id]);
 */
export function setTranslateContext(translateWithId) {
  setContext(TRANSLATE_CONTEXT_KEY, translateWithId);
}

/**
 * The function set by the nearest `setTranslateContext`, if any. Call
 * during component initialization.
 * @returns {undefined | ((id: string) => string | undefined)}
 */
export function getTranslateContext() {
  return getContext(TRANSLATE_CONTEXT_KEY);
}
