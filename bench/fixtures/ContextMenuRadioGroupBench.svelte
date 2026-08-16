<svelte:options accessors />

<script lang="ts">
  import ContextMenu from "carbon-components-svelte/ContextMenu/ContextMenu.svelte";
  import ContextMenuOption from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";
  import ContextMenuRadioGroup from "carbon-components-svelte/ContextMenu/ContextMenuRadioGroup.svelte";

  export let count = 10;
</script>

<!-- ContextMenu mounts item-slot children even when closed. `open` is still
  true so this matches the other benches' visible-mount setup. -->
<ContextMenu open>
  <ContextMenuRadioGroup labelText="Options">
    {#each { length: count } as _, i}
      <ContextMenuOption id={`option-${i}`} labelText={`Option ${i}`} />
    {/each}
  </ContextMenuRadioGroup>
</ContextMenu>
