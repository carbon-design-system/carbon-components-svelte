<script>
  /**
   * @event {null} save
   * @event {{ prevValue: any; value: any; }} update
   */

  /**
   * Specify the local storage key
   */
  export let key = "local-storage-key";

  /**
   * Provide a value to persist
   * @type {any}
   */
  export let value = "";

  /**
   * Remove the persisted key value from the browser's local storage
   * @type {() => void}
   */
  export function clearItem() {
    localStorage.removeItem(key);
  }

  /**
   * Clear all key values from the browser's local storage
   * @type {() => void}
   */
  export function clearAll() {
    localStorage.clear();
  }

  import { onMount, afterUpdate, createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let prevValue = value;

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
  });

  afterUpdate(() => {
    if (prevValue !== value) {
      setItem(value);
      dispatch("update", { prevValue, value });
    }

    prevValue = value;
  });
</script>
