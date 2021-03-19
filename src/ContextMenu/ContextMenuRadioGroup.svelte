<script>
  /** Set the selected radio group id */
  export let selectedId = "";

  /** Specify the label text */
  export let labelText = "";

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import ContextMenuGroup from "./ContextMenuGroup.svelte";

  const currentId = writable("");

  setContext("ContextMenuRadioGroup", {
    currentId,
    setOption: ({ id }) => {
      selectedId = id;
    },
  });

  $: currentId.set(selectedId);
</script>

<ContextMenuGroup labelText="{labelText}">
  <slot />
</ContextMenuGroup>
