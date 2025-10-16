<script lang="ts">
  import { ContextMenu, ContextMenuOption } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let target: ComponentProps<ContextMenu>["target"] = null;
  export let open = false;
  export let x = 0;
  export let y = 0;
  export let ref: ComponentProps<ContextMenu>["ref"] = null;
  export let withSubmenu = false;
</script>

<div data-testid="target">Right click me</div>

<ContextMenu
  bind:target
  bind:open
  {x}
  {y}
  bind:ref
  on:open={(e) => {
    console.log("open", e.detail);
  }}
  on:close={() => {
    console.log("close");
  }}
>
  <ContextMenuOption labelText="Option 1" />
  {#if withSubmenu}
    <ContextMenuOption labelText="Option with submenu">
      <ContextMenuOption labelText="Submenu option 1" />
      <ContextMenuOption labelText="Submenu option 2" />
    </ContextMenuOption>
  {:else}
    <ContextMenuOption labelText="Option 2" />
  {/if}
</ContextMenu>
