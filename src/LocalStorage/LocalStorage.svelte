<script>
  /**
   * @event {null} save
   * @event update - Fires when the stored value changes, either from a bound value update or when localStorage is modified from another tab/window.
   * @property {any} prevValue
   * @property {any} value
   */

  /**
   * Specify the local storage key.
   */
  export let key = "local-storage-key";

  /**
   * Provide a value to persist.
   * @type {any}
   */
  export let value = "";

  /**
   * Remove the persisted key value from the browser's local storage
   * @type {() => void}
   * @example
   * ```svelte
   * <LocalStorage bind:this={storage} key="my-key" bind:value={data} />
   * <button on:click={() => storage.clearItem()}>Clear Item</button>
   * ```
   */
  export function clearItem() {
    localStorage.removeItem(key);
  }

  /**
   * Clear all key values from the browser's local storage
   * @type {() => void}
   * @example
   * ```svelte
   * <LocalStorage bind:this={storage} key="my-key" bind:value={data} />
   * <button on:click={() => storage.clearAll()}>Clear All Storage</button>
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

  function setItem() {
    if (typeof value === "object") {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value);
    }
  }

  onMount(() => {
    const item = localStorage.getItem(key);

    if (item != null) {
      try {
        value = JSON.parse(item);
      } catch (e) {
        value = item;
      }
    } else {
      setItem(value);
      dispatch("save");
    }

    mounted = true;

    function handleStorageChange(event) {
      if (event.key === key && event.newValue !== null) {
        try {
          value = JSON.parse(event.newValue);
        } catch (e) {
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

    if (item != null) {
      try {
        value = JSON.parse(item);
      } catch (e) {
        value = item;
      }
    } else {
      setItem(value);
    }

    prevKey = key;
  }

  afterUpdate(() => {
    if (prevValue !== value) {
      setItem(value);
      dispatch("update", { prevValue, value });
    }

    prevValue = value;
  });
</script>
