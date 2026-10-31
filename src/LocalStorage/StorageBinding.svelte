<script>
  // Internal: shared persistence engine for `LocalStorage` and
  // `SessionStorage`, which are identical apart from the storage type and
  // their public JSDoc/prop defaults (kept literal in each file for sveld).
  // Not part of the public API — no `index.js` export.

  /** @type {"localStorage" | "sessionStorage"} */
  export let storageType;

  /** @type {string} */
  export let key;

  /** @type {any} */
  export let value;

  /** @type {"on" | "off"} */
  export let sync = "on";

  import { createEventDispatcher, onMount, tick } from "svelte";
  import {
    parseStoredValue,
    safeBrowserStorage,
    serializeStoredValue,
  } from "../utils/storage.js";

  const dispatch = createEventDispatcher();
  const storage = safeBrowserStorage(storageType);

  // Change detection compares the serialized form (what actually lands in
  // storage) rather than the raw `value` reference. This persists in-place
  // mutations signalled via the Svelte `value = value` idiom — a referential
  // `prevValue !== value` check cannot, since `prevValue` would alias `value` —
  // and skips redundant writes when a new reference serializes identically.
  let prevSerialized = serializeStoredValue(value);
  let prevKey = key;
  let mounted = false;

  /** @param {string} [serialized] */
  function setItem(serialized = serializeStoredValue(value)) {
    storage.setItem(key, serialized, (error) => {
      dispatch("error", { error });
    });
  }

  function handleStorageChange(event) {
    // `storage` fires for both areas; skip writes to the other one.
    if (event.storageArea && event.storageArea !== window[storageType]) return;
    // A null key means another document called clear().
    if (event.key === null || event.key === key) applyChange(event.newValue);
  }

  /** @param {string | null} changedKey null after clear() */
  function handlePeerChange(changedKey) {
    // Re-read storage rather than trusting the order of notifications, so
    // interleaved writes from two instances settle on what was stored last.
    if (changedKey === null || changedKey === key) {
      applyChange(storage.getItem(key));
    }
  }

  /** @param {string | null} newValue */
  function applyChange(newValue) {
    // A null value means the key was removed or storage cleared. Reset so
    // the next local mutation does not re-persist stale state.
    const nextValue =
      newValue === null ? undefined : parseStoredValue(newValue);
    // Not `newValue`: non-canonical JSON (e.g. `{ "a": 1 }`) would differ
    // from the re-serialized value and get written back.
    const serialized = serializeStoredValue(nextValue);

    if (serialized === prevSerialized) return;

    const prevValue = parseStoredValue(prevSerialized);
    value = nextValue;
    prevSerialized = serialized;
    dispatch("update", { prevValue, value });
  }

  onMount(() => {
    const item = storage.getItem(key);

    if (item == null) {
      setItem();
      dispatch("save");
    } else {
      value = parseStoredValue(item);
    }

    prevSerialized = serializeStoredValue(value);
    mounted = true;

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      stopPeerChange?.();
    };
  });

  /** @type {null | (() => void)} */
  let stopPeerChange = null;

  // Attach listeners for other tabs (storage event) and other instances on
  // this page when sync is on. Re-run when sync changes.
  $: if (mounted) {
    window.removeEventListener("storage", handleStorageChange);
    stopPeerChange?.();
    stopPeerChange = null;

    if (sync === "on") {
      window.addEventListener("storage", handleStorageChange);
      stopPeerChange = storage.onPeerChange(handlePeerChange);
    }
  }

  $: if (mounted && key !== prevKey) {
    const item = storage.getItem(key);

    if (item == null) {
      setItem();
    } else {
      value = parseStoredValue(item);
    }

    prevKey = key;
    prevSerialized = serializeStoredValue(value);
  }

  $: if (mounted) {
    const serialized = serializeStoredValue(value);

    if (serialized !== prevSerialized) {
      const prevValue = parseStoredValue(prevSerialized);
      const nextValue = value;
      // Write storage and prevSerialized first. Defer update with tick(); a
      // synchronous dispatch that throws can abort the flush and block later writes.
      setItem(serialized);
      prevSerialized = serialized;
      tick().then(() => dispatch("update", { prevValue, value: nextValue }));
    }
  }

  /**
   * Remove `key` from storage and reset `value`.
   * @returns {void}
   */
  export function clearItem() {
    storage.removeItem(key);
    // Reset as a remote removal does, so the write block does not re-persist
    // the key that was just cleared.
    applyChange(null);
  }

  /**
   * Clear every key in storage and reset `value`.
   * @returns {void}
   */
  export function clearAll() {
    storage.clear();
    applyChange(null);
  }
</script>
