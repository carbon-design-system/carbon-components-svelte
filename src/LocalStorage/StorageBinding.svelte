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

  /**
   * `"tabs"` also shares changes with other tabs over BroadcastChannel; only
   * SessionStorage offers it, since localStorage already reaches other tabs.
   * @type {"on" | "off" | "tabs"}
   */
  export let sync = "on";

  import { createEventDispatcher, onMount, tick } from "svelte";
  import {
    joinTabChannel,
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

  /** @type {null | ReturnType<typeof joinTabChannel>} */
  let tabs = null;
  // False while `key` holds only the seeded default: not hydrated from
  // storage, written locally or received from another tab. Such a tab asks
  // other tabs for the value and does not answer them, so two new tabs do
  // not hand each other their defaults.
  let hasState = false;

  function requestTabState() {
    if (!hasState) tabs?.post({ type: "hello", key });
  }

  /** @param {import("../utils/storage.js").TabMessage} message */
  function handleTabMessage(message) {
    if (message.type === "clear") {
      applyRemoteChange(null);
      return;
    }
    if (message.key !== key) return;

    if (message.type === "hello") {
      const item = storage.getItem(key);
      if (hasState && item !== null) {
        tabs?.post({ type: "state", key, value: item });
      }
      return;
    }

    if (message.type === "set" || (message.type === "state" && !hasState)) {
      applyRemoteChange(message.value);
    }
  }

  /**
   * Another tab has no access to this tab's sessionStorage, so store the
   * change here as well. Not re-broadcast.
   * @param {string | null} serialized
   */
  function applyRemoteChange(serialized) {
    hasState = true;
    if (serialized === null) {
      storage.removeItem(key);
    } else {
      setItem(serialized);
    }
    applyChange(serialized);
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
    hasState = item != null;

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
      tabs?.leave();
    };
  });

  /** @type {null | (() => void)} */
  let stopPeerChange = null;

  // Attach listeners for other tabs (storage event) and other instances on
  // this page unless sync is off, plus the tab channel for "tabs". Re-run
  // when sync changes.
  $: if (mounted) {
    window.removeEventListener("storage", handleStorageChange);
    stopPeerChange?.();
    stopPeerChange = null;
    tabs?.leave();
    tabs = null;

    if (sync !== "off") {
      window.addEventListener("storage", handleStorageChange);
      stopPeerChange = storage.onPeerChange(handlePeerChange);
    }

    if (sync === "tabs") {
      tabs = joinTabChannel(handleTabMessage);
      requestTabState();
    }
  }

  $: if (mounted && key !== prevKey) {
    const item = storage.getItem(key);
    hasState = item != null;

    if (item == null) {
      setItem();
    } else {
      value = parseStoredValue(item);
    }

    prevKey = key;
    prevSerialized = serializeStoredValue(value);
    requestTabState();
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
      hasState = true;
      tabs?.post({ type: "set", key, value: serialized });
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
    tabs?.post({ type: "set", key, value: null });
  }

  /**
   * Clear every key in storage and reset `value`.
   * @returns {void}
   */
  export function clearAll() {
    storage.clear();
    applyChange(null);
    tabs?.post({ type: "clear" });
  }
</script>
