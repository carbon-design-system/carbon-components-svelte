<script lang="ts">
  import ContextMenu from "carbon-components-svelte/ContextMenu/ContextMenu.svelte";
  import ContextMenuOption from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";

  export let open = false;
  export let x = 0;
  export let y = 0;
</script>

<ContextMenu
  bind:open
  {x}
  {y}
  on:close={(e) => {
    console.log("close", e.detail.trigger);
  }}
>
  <ContextMenuOption labelText="Option 1" />
  <ContextMenuOption labelText="Option 2" />
</ContextMenu>
