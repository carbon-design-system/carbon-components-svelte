// @ts-check
import { writable } from "svelte/store";
import { joinDescribedBy } from "./field-status.js";

/**
 * @typedef {"label" | "helper" | "invalid" | "warn"} FormPartKind
 * @typedef {Record<FormPartKind, string[]>} FormParts
 * @typedef {{
 *   (id: string | undefined): void,
 *   numbered: (id: string | undefined) => string | undefined,
 * }} FormPart
 */

/**
 * Registry of the form parts (`FormLabel`, `FormHelperText`,
 * `FormRequirement`) mounted inside a `FormItem` or `FormGroup`. Each
 * part registers its id under its kind while it's mounted.
 *
 * @returns {{
 *   parts: import("svelte/store").Writable<FormParts>,
 *   part: (kind: FormPartKind) => FormPart,
 * }}
 */
export function createFormParts() {
  const parts = writable(
    /** @type {FormParts} */ ({ label: [], helper: [], invalid: [], warn: [] }),
  );

  /**
   * Ordinals taken by each kind's registered parts.
   * @type {Record<FormPartKind, Set<number>>}
   */
  const ordinals = {
    label: new Set(),
    helper: new Set(),
    invalid: new Set(),
    warn: new Set(),
  };

  /**
   * Create a setter that registers one part's id under `kind`.
   * Setting `undefined` unregisters it. `numbered` suffixes a default id
   * with the lowest ordinal no other part of the kind holds, so parts of
   * one kind don't share an id. Parts render in the same order on the
   * server and the client, so the ids match. Unregistering frees the
   * ordinal, so a message that comes and goes keeps its id.
   * @param {FormPartKind} kind
   * @returns {FormPart}
   */
  function part(kind) {
    /** @type {string | undefined} */
    let registered;
    /** @type {number | undefined} */
    let ordinal;

    /** @param {string | undefined} id */
    function setPartId(id) {
      if (id === undefined && ordinal !== undefined) {
        ordinals[kind].delete(ordinal);
        ordinal = undefined;
      }
      if (id === registered) return;
      parts.update((current) => {
        const ids = [...current[kind]];
        const index = registered === undefined ? -1 : ids.indexOf(registered);
        if (index !== -1) ids.splice(index, 1);
        if (id !== undefined) ids.push(id);
        return { ...current, [kind]: ids };
      });
      registered = id;
    }

    /** @param {string | undefined} id */
    setPartId.numbered = (id) => {
      if (!id) return id;
      if (ordinal === undefined) {
        ordinal = 0;
        while (ordinals[kind].has(ordinal)) ordinal++;
        ordinals[kind].add(ordinal);
      }
      return ordinal ? `${id}-${ordinal}` : id;
    };

    return setPartId;
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
