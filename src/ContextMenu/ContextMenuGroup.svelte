<script>
  /**
   * @type {ReadonlyArray<string>}
   * @bindable writable
   */
  export let selectedIds = [];

  /** Specify the label text */
  export let labelText = "";

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import {
    addUniqueArrayItem,
    toggleArrayItem,
  } from "../utils/array-set-ops.js";

  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<string>>}
   */
  const currentIds = writable([]);

  /**
   * @type {(data: { id: string }) => void}
   */
  function addOption({ id }) {
    selectedIds = addUniqueArrayItem(selectedIds, id);
  }

  /**
   * @type {(data: { id: string }) => void}
   */
  function toggleOption({ id }) {
    selectedIds = toggleArrayItem(selectedIds, id);
  }

  setContext("carbon:ContextMenuGroup", {
    currentIds,
    addOption,
    toggleOption,
  });

  $: currentIds.set(selectedIds);
</script>

<li role="none">
  <ul role="group" aria-label={labelText}>
    <slot />
  </ul>
</li>
