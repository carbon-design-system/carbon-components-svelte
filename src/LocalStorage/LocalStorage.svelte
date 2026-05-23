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
    localStorage.removeItem(key);
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
    localStorage.clear();
  }

  import { afterUpdate, createEventDispatcher, onMount } from "svelte";

  const dispatch = createEventDispatcher();

  let prevValue = value;
  let prevKey = key;
  let mounted = false;

  /** @type {() => void} */
  function setItem() {
    if (typeof value === "object") {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value);
    }
  }

  onMount(() => {
    const item = localStorage.getItem(key);

    if (item == null) {
      setItem();
      dispatch("save");
    } else {
      try {
        value = JSON.parse(item);
      } catch {
        value = item;
      }
    }

    mounted = true;

    function handleStorageChange(event) {
      if (event.key === key && event.newValue !== null) {
        try {
          value = JSON.parse(event.newValue);
        } catch {
          value = event.newValue;
        }
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
    const item = localStorage.getItem(key);

    if (item == null) {
      setItem();
    } else {
      try {
        value = JSON.parse(item);
      } catch {
        value = item;
      }
    }

    prevKey = key;
  }

  afterUpdate(() => {
    if (prevValue !== value) {
      setItem();
      dispatch("update", { prevValue, value });
    }

    prevValue = value;
  });
</script>
