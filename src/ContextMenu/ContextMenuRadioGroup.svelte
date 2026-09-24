<script>
  /**
   * Set the selected radio group id.
   * @bindable writable
   */
  export let selectedId = "";

  /** Specify the label text */
  export let labelText = "";

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import { addUniqueArrayItem } from "../utils/array-set-ops.js";
  import { batchStoreUpdates } from "../utils/batch-store-updates.js";

  /**
   * @type {import("svelte/store").Writable<string>}
   */
  const currentId = writable("");
  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<string>>}
   */
  const radioIds = writable([]);
  // Every item in the group calls addOption once to register itself; batch
  // same-microtask registrations into a single flush instead of notifying
  // subscribers once per item.
  const batchedRadioIdsUpdate = batchStoreUpdates(radioIds);

  /**
   * @type {(data: { id: string }) => void}
   */
  function addOption({ id }) {
    batchedRadioIdsUpdate((current) => addUniqueArrayItem(current, id));
  }

  /**
   * @type {(data: { id: string }) => void}
   */
  function setOption({ id }) {
    selectedId = id;
  }

  setContext("carbon:ContextMenuRadioGroup", {
    currentId,
    radioIds,
    addOption,
    setOption,
  });

  $: currentId.set(selectedId);
</script>

<li role="none">
  <ul role="group" aria-label={labelText}>
    <slot />
  </ul>
</li>
