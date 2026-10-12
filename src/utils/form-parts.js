// @ts-check
import { writable } from "svelte/store";
import { joinDescribedBy } from "./field-status.js";

/**
 * @typedef {"label" | "helper" | "invalid" | "warn"} FormPartKind
 * @typedef {Record<FormPartKind, string[]>} FormParts
 */

/**
 * Registry of the form parts (`FormLabel`, `FormHelperText`,
 * `FormRequirement`) mounted inside a `FormItem` or `FormGroup`. Each
 * part registers its id under its kind while it's mounted.
 *
 * @returns {{
 *   parts: import("svelte/store").Writable<FormParts>,
 *   part: (kind: FormPartKind) => (id: string | undefined) => void,
 * }}
 */
export function createFormParts() {
  const parts = writable(
    /** @type {FormParts} */ ({ label: [], helper: [], invalid: [], warn: [] }),
  );

  /**
   * Create a setter that registers one part's id under `kind`.
   * Setting `undefined` unregisters it.
   * @param {FormPartKind} kind
   * @returns {(id: string | undefined) => void}
   */
  function part(kind) {
    /** @type {string | undefined} */
    let registered;

    return function setPartId(id) {
      if (id === registered) return;
      parts.update((current) => {
        const ids = [...current[kind]];
        const index = registered === undefined ? -1 : ids.indexOf(registered);
        if (index !== -1) ids.splice(index, 1);
        if (id !== undefined) ids.push(id);
        return { ...current, [kind]: ids };
      });
      registered = id;
    };
  }

  return { parts, part };
}

/**
 * The `aria-describedby` value for the mounted parts: invalid messages,
 * then warnings, then helper text.
 *
 * @param {FormParts} parts
 * @returns {string | undefined}
 */
export function partsDescribedBy(parts) {
  return joinDescribedBy(...parts.invalid, ...parts.warn, ...parts.helper);
}
