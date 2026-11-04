// @ts-check

import { derived, get, readable, writable } from "svelte/store";
import { createUnsavedChanges } from "../UnsavedChanges/unsaved-changes.js";
import { deepEqual } from "../utils/deep-equal.js";

/**
 * @typedef {Record<string, any>} SettingsValues
 * @typedef {{ errors?: Record<string, string> } | void} SettingsSaveResult
 */

/**
 * A copy of `value` that shares no array, plain object or `Date` with it.
 * Anything else, such as a function or a class instance, is kept by reference.
 *
 * @template T
 * @param {T} value
 * @returns {T}
 */
function cloneValue(value) {
  if (Array.isArray(value)) {
    return /** @type {any} */ (value.map(cloneValue));
  }
  if (value instanceof Date) return /** @type {any} */ (new Date(value));
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    /** @type {Record<string, any>} */
    const copy = {};
    for (const [key, item] of Object.entries(value))
      copy[key] = cloneValue(item);
    return /** @type {any} */ (copy);
  }
  return value;
}

/**
 * @param {ReadonlySet<string>} a
 * @param {ReadonlySet<string>} b
 */
function sameSet(a, b) {
  if (a.size !== b.size) return false;
  for (const item of a) if (!b.has(item)) return false;
  return true;
}

/**
 * The keys whose value in `current` differs from `baseline`, among the keys
 * `baseline` has when `baselineKeysOnly` is set.
 *
 * @param {SettingsValues} current
 * @param {SettingsValues} baseline
 * @param {boolean} baselineKeysOnly
 * @returns {Set<string>}
 */
function differingKeys(current, baseline, baselineKeysOnly) {
  /** @type {Set<string>} */
  const keys = new Set();
  const candidates = baselineKeysOnly
    ? Object.keys(baseline)
    : new Set([...Object.keys(current), ...Object.keys(baseline)]);
  for (const key of candidates) {
    if (!deepEqual(current[key], baseline[key])) keys.add(key);
  }
  return keys;
}

/**
 * A derived set of keys that emits only when its members change, so a
 * keystroke in one field does not re-run every row that reads the set.
 *
 * @param {import("svelte/store").Readable<SettingsValues>} values
 * @param {import("svelte/store").Readable<SettingsValues>} baseline
 * @param {boolean} [baselineKeysOnly]
 * @returns {import("svelte/store").Readable<ReadonlySet<string>>}
 */
function differingSet(values, baseline, baselineKeysOnly = false) {
  /** @type {ReadonlySet<string>} */
  let previous = new Set();
  return derived(
    [values, baseline],
    ([$values, $baseline], set) => {
      const next = differingKeys($values, $baseline, baselineKeysOnly);
      if (sameSet(previous, next)) return;
      previous = next;
      set(next);
    },
    previous,
  );
}

/**
 * Create the state of a settings page: the working values, the last saved
 * values, the factory defaults, and the server's field errors.
 *
 * @template {SettingsValues} T
 * @param {T} initial The saved values.
 * @param {{
 *   defaults?: Partial<T>,
 *   optimistic?: boolean,
 *   beforeUnload?: boolean,
 * }} [options]
 */
export function createSettings(initial, options = {}) {
  /** @type {Partial<T>} */
  const defaults = cloneValue(options.defaults ?? initial);
  const optimistic = options.optimistic === true;

  const values = writable(cloneValue(initial));
  const saved = writable(cloneValue(initial));
  const saving = writable(false);
  /** @type {import("svelte/store").Writable<Record<string, { message: string, value: unknown }>>} */
  const failures = writable({});
  /** @type {import("svelte/store").Writable<{ state: "idle" | "saving" | "saved" | "error", error?: unknown }>} */
  const status = writable({ state: "idle" });
  const unsaved = createUnsavedChanges({ beforeUnload: options.beforeUnload });

  const modified = differingSet(values, saved);
  const dirty = derived(modified, ($modified) => $modified.size > 0);
  const changed = derived(modified, ($modified) => $modified.size);

  /** Keys that differ from the factory default, which show "Reset". */
  const customized = differingSet(values, readable(defaults), true);

  // A server message belongs to the value it rejected. Editing the field
  // withdraws it, so a stale "already taken" does not outlive the fix.
  /** @type {Record<string, string>} */
  let previousErrors = {};
  const errors = derived(
    [failures, values],
    ([$failures, $values], set) => {
      /** @type {Record<string, string>} */
      const next = {};
      for (const [key, failure] of Object.entries($failures)) {
        if (deepEqual($values[key], failure.value)) next[key] = failure.message;
      }
      const keys = Object.keys(next);
      if (
        keys.length === Object.keys(previousErrors).length &&
        keys.every((key) => previousErrors[key] === next[key])
      ) {
        return;
      }
      previousErrors = next;
      set(next);
    },
    /** @type {Record<string, string>} */ ({}),
  );

  /**
   * Show server messages on their fields.
   *
   * @param {Record<string, string>} messages
   */
  function setErrors(messages) {
    const current = get(values);
    /** @type {Record<string, { message: string, value: unknown }>} */
    const next = {};
    for (const [key, message] of Object.entries(messages)) {
      next[key] = { message, value: cloneValue(current[key]) };
    }
    failures.set(next);
  }

  function clearErrors() {
    failures.set({});
  }

  /**
   * Put a field back to its factory default.
   * @param {keyof T & string} key
   */
  function resetField(key) {
    values.update(($values) => ({
      ...$values,
      [key]: cloneValue(defaults[key]),
    }));
  }

  /** Put every field back to its last saved value. */
  function discard() {
    values.set(cloneValue(get(saved)));
    clearErrors();
    status.set({ state: "idle" });
  }

  /**
   * Take `next` as both the working and the saved values, for settings that
   * arrive after the page renders.
   *
   * @param {T} next
   */
  function load(next) {
    values.set(cloneValue(next));
    saved.set(cloneValue(next));
    clearErrors();
    status.set({ state: "idle" });
  }

  /**
   * Run `handler` with a copy of the values. A resolved handler saves them.
   * Resolve `{ errors: { field: "message" } }` to reject fields, or throw to
   * fail the whole save; either keeps the page dirty. With `optimistic`, the
   * saved values update at once and roll back on failure, so the save bar
   * clears without waiting for the server.
   *
   * @param {(values: T) => SettingsSaveResult | Promise<SettingsSaveResult>} handler
   * @returns {Promise<{ ok: boolean, errors?: Record<string, string>, error?: unknown }>}
   */
  async function save(handler) {
    if (get(saving)) return { ok: false };
    const snapshot = cloneValue(get(values));
    const previous = get(saved);
    clearErrors();
    saving.set(true);
    status.set({ state: "saving" });
    if (optimistic) saved.set(cloneValue(snapshot));
    try {
      const result = await handler(snapshot);
      const rejected = result?.errors ?? {};
      if (Object.keys(rejected).length > 0) {
        if (optimistic) saved.set(previous);
        // The server rejected the snapshot, not whatever was typed since.
        failures.set(
          Object.fromEntries(
            Object.entries(rejected).map(([key, message]) => [
              key,
              { message, value: cloneValue(snapshot[key]) },
            ]),
          ),
        );
        status.set({ state: "error" });
        return { ok: false, errors: rejected };
      }
      saved.set(cloneValue(snapshot));
      status.set({ state: "saved" });
      return { ok: true };
    } catch (error) {
      if (optimistic) saved.set(previous);
      status.set({ state: "error", error });
      return { ok: false, error };
    } finally {
      saving.set(false);
    }
  }

  return {
    values,
    saved: { subscribe: saved.subscribe },
    modified,
    customized,
    dirty,
    changed,
    errors,
    saving: { subscribe: saving.subscribe },
    status: { subscribe: status.subscribe },
    unsaved,
    setErrors,
    clearErrors,
    resetField,
    discard,
    load,
    save,
  };
}
