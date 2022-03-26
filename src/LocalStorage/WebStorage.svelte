<script>
  /**
   * @event {null} save
   * @event {{ prevKey: any; key: any; }} updateKey
   * @event {{ prevValue: any; value: any; }} update
   */

  /**
   * Specify the local storage key
   */
  export let key = "storage-key";

  /**
   * Provide a value to persist
   * @type {any}
   */
  export let value = "";

  /**
   * Select WebStorage to use
   * @type {"local"|"session"}
   */
  export let storage = "local";

  $: webStorage = storage === "session" ? sessionStorage : localStorage;

  /**
   * Remove the persisted key value from the browser's selected WebStorage
   * @type {() => void}
   */
  export function clearItem() {
    webStorage.removeItem(key);
  }

  /**
   * Clear all key values from the browser's selected WebStorage
   * @type {() => void}
   */
  export function clearAll() {
    webStorage.clear();
  }

  import { onMount, afterUpdate, createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let prevKey = key;
  let prevValue = value;

  function setItem() {
    if (typeof value === "object") {
      webStorage.setItem(key, JSON.stringify(value));
    } else {
      webStorage.setItem(key, value);
    }
  }

  function init() {
    const item = webStorage.getItem(key);

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
  }

  onMount(() => {
    init();
  });

  afterUpdate(() => {
    if (prevKey !== key) {
      init();
      dispatch("updateKey", { prevKey, key });
      prevKey = key;
    }
    if (prevValue !== value) {
      setItem(value);
      dispatch("update", { prevValue, value });
    }

    prevValue = value;
  });
</script>
