<script>
  /** @type {ReadonlyArray<string>} */
  export let selectedIds = [];

  /** Specify the label text */
  export let labelText = "";

  import { setContext } from "svelte";
  import { writable } from "svelte/store";

  const currentIds = writable([]);

  setContext("ContextMenuGroup", {
    currentIds,
    addOption: ({ id }) => {
      if (!selectedIds.includes(id)) {
        selectedIds = [...selectedIds, id];
      }
    },
    toggleOption: ({ id }) => {
      if (!selectedIds.includes(id)) {
        selectedIds = [...selectedIds, id];
      } else {
        selectedIds = selectedIds.filter((_) => _ !== id);
      }
    },
  });

  $: currentIds.set(selectedIds);
</script>

<li role="none">
  <ul role="group" aria-label="{labelText}">
    <slot />
  </ul>
</li>
