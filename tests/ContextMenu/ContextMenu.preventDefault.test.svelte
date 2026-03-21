<script lang="ts">
  import { ContextMenu, ContextMenuOption } from "carbon-components-svelte";
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
  <ContextMenuOption
    labelText="Stay open"
    on:click={(e) => {
      console.log("click", "Stay open");
      e.preventDefault();
    }}
  />
  <ContextMenuOption
    labelText="Close menu"
    on:click={() => {
      console.log("click", "Close menu");
    }}
  />
</ContextMenu>
