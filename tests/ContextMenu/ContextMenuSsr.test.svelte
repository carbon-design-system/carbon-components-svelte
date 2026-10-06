<script lang="ts">
  import ContextMenu from "carbon-components-svelte/ContextMenu/ContextMenu.svelte";
  import ContextMenuOption from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";

  export let open = false;
</script>

<ContextMenu {open} labelText="Actions">
  <ContextMenuOption labelText="Copy" />
  <ContextMenuOption labelText="More">
    <ContextMenuOption labelText="Nested" />
  </ContextMenuOption>
</ContextMenu>
