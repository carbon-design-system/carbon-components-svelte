<script>
  // Internal: shared persistence engine for `LocalStorage` and
  // `SessionStorage`, which are identical apart from the storage type and
  // their public JSDoc/prop defaults (kept literal in each file for sveld).
  // Not part of the public API — no `index.js` export.

  /** @type {"localStorage" | "sessionStorage"} */
  export let storageType;

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
    if (event.key !== key) return;

    const prevValue = parseStoredValue(prevSerialized);

    if (event.newValue === null) {
      // Another tab/document removed the key (or called clear()).
      // Reset so the next local mutation does not re-persist stale state.
      value = undefined;
      prevSerialized = serializeStoredValue(value);
    } else {
      value = parseStoredValue(event.newValue);
      prevSerialized = event.newValue;
    }

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
    };
  });

  // Attach storage listener when sync is on. Re-run when sync changes.
  $: if (mounted) {
    window.removeEventListener("storage", handleStorageChange);

    if (sync === "on") {
      window.addEventListener("storage", handleStorageChange);
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

  export function clearItem() {
    storage.removeItem(key);
  }

  export function clearAll() {
    storage.clear();
  }
</script>
