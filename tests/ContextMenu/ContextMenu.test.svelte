<script lang="ts">
  import ContextMenu from "carbon-components-svelte/ContextMenu/ContextMenu.svelte";
  import ContextMenuOption from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";
  import type { ComponentProps } from "svelte";

  export let target: ComponentProps<ContextMenu>["target"] = null;
  export let open = false;
  export let x = 0;
  export let y = 0;
  export let ref: ComponentProps<ContextMenu>["ref"] = null;
  export let withSubmenu = false;
  export let withDisabled = false;
  export let submenuDisabled = false;
  export let optionDisabled = false;
  export let labelText: ComponentProps<ContextMenu>["labelText"] = undefined;
  export let ariaLabel: string | undefined = undefined;
</script>

<div data-testid="target">Right click me</div>

<ContextMenu
  bind:target
  bind:open
  {x}
  {y}
  {labelText}
  aria-label={ariaLabel}
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
    <ContextMenuOption
      labelText="Option with submenu"
      disabled={submenuDisabled}
    >
      <ContextMenuOption labelText="Submenu option 1" />
      <ContextMenuOption labelText="Submenu option 2" />
    </ContextMenuOption>
  {:else if withDisabled}
    <ContextMenuOption labelText="Disabled option" disabled />
  {:else}
    <ContextMenuOption labelText="Option 2" disabled={optionDisabled} />
    <ContextMenuOption labelText="Option 3" />
  {/if}
</ContextMenu>
