<script>
  /**
   * @template [T=any]
   * @event {null} save
   * @event update - Fires when the stored value changes, either from a bound value update or when localStorage is modified from another tab/window.
   * @property {T} prevValue
   * @property {T} value
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

  let prevValue = value;
  let prevKey = key;
  let mounted = false;

  /** @type {() => void} */
  function setItem() {
    storage.setItem(key, serializeStoredValue(value));
  }

  onMount(() => {
    const item = storage.getItem(key);

    if (item == null) {
      setItem();
      dispatch("save");
    } else {
      value = parseStoredValue(item);
    }

    prevValue = value;
    mounted = true;

    function handleStorageChange(event) {
      if (event.key === key && event.newValue !== null) {
        value = parseStoredValue(event.newValue);
        dispatch("update", { prevValue, value });
        prevValue = value;
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
    prevValue = value;
  }

  afterUpdate(() => {
    if (prevValue !== value) {
      setItem();
      dispatch("update", { prevValue, value });
    }

    prevValue = value;
  });
</script>
