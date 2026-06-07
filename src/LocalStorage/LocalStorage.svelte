<script>
  /**
   * @template [T=any]
   * @event {null} save
   * @event update - Fires when the stored value changes, either from a bound value update or when localStorage is modified from another tab/window.
   * @property {T} prevValue
   * @property {T} value
   * @event {{ error: unknown }} error - Fires when a write to localStorage fails (e.g. quota exceeded or access denied).
   */

  /**
   * Specify the local storage key.
   */
  export let key = "local-storage-key";

  /**
   * Provide a value to persist.
   * @type {T}
   * @bindable writable
   */
  export let value = /** @type {T} */ ("");

  /**
   * Remove the persisted key value from the browser's local storage.
   * Note: this only clears storage; the bound `value` is left untouched.
   * If `value` mutates afterwards, it will be re-persisted. Reset `value`
   * yourself if you want it cleared as well.
   * @type {() => void}
   * @example
   * ```svelte
   * <LocalStorage bind:this={storage} key="my-key" bind:value={data} />
   * <button on:click={() => { storage.clearItem(); data = ""; }}>Clear Item</button>
   * ```
   */
  export function clearItem() {
    storage.removeItem(key);
  }

  /**
   * Clear all key values from the browser's local storage.
   * Note: this only clears storage; the bound `value` is left untouched.
   * If `value` mutates afterwards, it will be re-persisted. Reset `value`
   * yourself if you want it cleared as well.
   * @type {() => void}
   * @example
   * ```svelte
   * <LocalStorage bind:this={storage} key="my-key" bind:value={data} />
   * <button on:click={() => { storage.clearAll(); data = ""; }}>Clear All Storage</button>
   * ```
   */
  export function clearAll() {
    storage.clear();
  }

  import { afterUpdate, createEventDispatcher, onMount } from "svelte";
  import {
    parseStoredValue,
    safeBrowserStorage,
    serializeStoredValue,
  } from "../utils/storage.js";

  const dispatch = createEventDispatcher();
  const storage = safeBrowserStorage("localStorage");

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

    function handleStorageChange(event) {
      if (event.key === key && event.newValue !== null) {
        const prevValue = parseStoredValue(prevSerialized);
        value = parseStoredValue(event.newValue);
        dispatch("update", { prevValue, value });
        prevSerialized = event.newValue;
      }
    }

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  });

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

  afterUpdate(() => {
    const serialized = serializeStoredValue(value);

    if (serialized !== prevSerialized) {
      const prevValue = parseStoredValue(prevSerialized);
      setItem(serialized);
      dispatch("update", { prevValue, value });
      prevSerialized = serialized;
    }
  });
</script>
