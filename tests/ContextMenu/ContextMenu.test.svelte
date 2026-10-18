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
  export let withRootSettings = false;
  export let withDisabled = false;
  export let submenuDisabled = false;
  export let optionDisabled = false;
  export let submenuOptionDisabled = false;
  export let labelText: ComponentProps<ContextMenu>["labelText"] = undefined;
  export let ariaLabel: string | undefined = undefined;
  export let preventFirst = false;
  export let onopen: (detail: unknown) => void = () => {};
  export let onclose: (trigger?: string) => void = () => {};
  export let onoptionclick: (labelText: string) => void = () => {};
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
  on:open={(e) => onopen(e.detail)}
  on:close={(e) => onclose(e.detail.trigger)}
>
  <ContextMenuOption
    labelText="Option 1"
    on:click={(e) => {
      onoptionclick("Option 1");
      if (preventFirst) e.preventDefault();
    }}
  />
  {#if withSubmenu}
    <ContextMenuOption
      labelText="Option with submenu"
      disabled={submenuDisabled}
    >
      <ContextMenuOption labelText="Submenu option 1" />
      <ContextMenuOption
        labelText="Submenu option 2"
        disabled={submenuOptionDisabled}
      />
      <ContextMenuOption labelText="Submenu option 3" />
    </ContextMenuOption>
    {#if withRootSettings}
      <ContextMenuOption labelText="Settings" />
    {/if}
  {:else if withDisabled}
    <ContextMenuOption labelText="Disabled option" disabled />
  {:else}
    <ContextMenuOption labelText="Option 2" disabled={optionDisabled} />
    <ContextMenuOption labelText="Option 3" />
  {/if}
</ContextMenu>
