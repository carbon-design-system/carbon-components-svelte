<script>
  import WebStorage from "./WebStorage.svelte";

  /**
   * Specify the local storage key
   */
  export let key = "session-storage-key";

  /**
   * Provide a value to persist
   * @type {any}
   */
  export let value = "";

  /** Obtain a reference to the WebStorage element */
  let storage = null;

  /**
   * Remove the persisted key value from the browser's local storage
   * @type {() => void}
   */
  export function clearItem() {
    storage.removeItem(key);
  }

  /**
   * Clear all key values from the browser's local storage
   * @type {() => void}
   */
  export function clearAll() {
    storage.clear();
  }
</script>

<WebStorage
  bind:this="{storage}"
  bind:key
  bind:value
  storage="session"
  on:save
  on:update
  on:updateKey
/>
