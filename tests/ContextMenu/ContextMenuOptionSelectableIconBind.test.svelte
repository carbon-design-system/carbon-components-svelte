<svelte:options accessors />

<script lang="ts">
  import ContextMenu from "carbon-components-svelte/ContextMenu/ContextMenu.svelte";
  import ContextMenuGroup from "carbon-components-svelte/ContextMenu/ContextMenuGroup.svelte";
  import ContextMenuOption from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";
  import CopyFile from "carbon-icons-svelte/lib/CopyFile.svelte";

  export let icon = CopyFile;
  export let indented = false;
</script>

<ContextMenu open={true} x={100} y={100}>
  <ContextMenuGroup labelText="Test group">
    <ContextMenuOption
      id="option1"
      labelText="Option 1"
      bind:icon
      bind:indented
    />
  </ContextMenuGroup>
</ContextMenu>
