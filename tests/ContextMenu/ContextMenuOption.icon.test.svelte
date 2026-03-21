<script lang="ts">
  import {
    ContextMenu,
    ContextMenuDivider,
    ContextMenuOption,
  } from "carbon-components-svelte";
  import CopyFile from "carbon-icons-svelte/lib/CopyFile.svelte";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let x = 0;
  export let y = 0;
</script>

<ContextMenu
  bind:open
  {x}
  {y}
  on:close={() => {
    console.log("close");
  }}
>
  <ContextMenuOption labelText="Copy" icon={CopyFile} />
  <ContextMenuOption labelText="Plain" />
  <ContextMenuDivider />
  <ContextMenuOption kind="danger" labelText="Delete" icon={CopyFile} />
</ContextMenu>
