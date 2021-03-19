<script>
  export let selectedId = "";

  export let label = "";

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

<ContextMenuGroup label="{label}">
  <slot />
</ContextMenuGroup>
