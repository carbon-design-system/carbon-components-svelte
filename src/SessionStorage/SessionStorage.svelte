<script>
  /**
   * @template [T=any]
   * @event {null} save
   * @event update - Fires when the stored value changes, either from a bound value update or when sessionStorage is modified by another same origin document in this tab (e.g. an iframe). Set `sync` to `"off"` to ignore those external updates.
   * @property {T} prevValue
   * @property {T} value
   * @event {{ error: unknown }} error - Fires when a write to sessionStorage fails (e.g. quota exceeded or access denied).
   */

  /**
   * Specify the session storage key.
   */
  export let key = "session-storage-key";

  /**
   * Provide a value to persist.
   * @type {T}
   * @bindable writable
   */
  export let value = /** @type {T} */ ("");

  /**
   * `"off"` ignores storage events from other documents in this tab (e.g. an
   * iframe). `"on"` (default) keeps the previous behavior.
   * @type {"on" | "off"}
   */
  export let sync = "on";

  /**
   * Remove the persisted key value from the browser's session storage.
   * Note: this only clears storage; the bound `value` is left untouched.
   * If `value` mutates afterwards, it will be re-persisted. Reset `value`
   * yourself if you want it cleared as well.
   * @type {() => void}
   * @example
   * ```svelte
   * <SessionStorage bind:this={storage} key="my-key" bind:value={data} />
   * <button on:click={() => { storage.clearItem(); data = ""; }}>Clear Item</button>
   * ```
   */
  export function clearItem() {
    storage.removeItem(key);
  }

  /**
   * Clear all key values from the browser's session storage.
   * Note: this only clears storage; the bound `value` is left untouched.
   * If `value` mutates afterwards, it will be re-persisted. Reset `value`
   * yourself if you want it cleared as well.
   * @type {() => void}
   * @example
   * ```svelte
   * <SessionStorage bind:this={storage} key="my-key" bind:value={data} />
   * <button on:click={() => { storage.clearAll(); data = ""; }}>Clear All Storage</button>
   * ```
   */
  export function clearAll() {
    storage.clear();
  }

  import { createEventDispatcher, onMount, tick } from "svelte";
  import {
    parseStoredValue,
    safeBrowserStorage,
    serializeStoredValue,
  } from "../utils/storage.js";

  const dispatch = createEventDispatcher();
  const storage = safeBrowserStorage("sessionStorage");

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
      // Another document removed the key (or called clear()).
      // Reset so the next local mutation does not re-persist stale state.
      value = /** @type {T} */ (undefined);
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
</script>
