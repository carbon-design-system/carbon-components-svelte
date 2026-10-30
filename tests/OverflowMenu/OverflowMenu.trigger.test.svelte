<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let iconDescription: ComponentProps<OverflowMenu>["iconDescription"] =
    "Options";
  export let ariaLabel: ComponentProps<OverflowMenu>["aria-label"] = undefined;
  export let tooltipPosition: ComponentProps<OverflowMenu>["tooltipPosition"] =
    "top";
  export let tooltipAlign: ComponentProps<OverflowMenu>["tooltipAlign"] =
    undefined;
  export let disabled = false;
  export let onParentKeydown: (event: KeyboardEvent) => void = () => {};
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:keydown={onParentKeydown}>
  <OverflowMenu
    data-testid="trigger"
    aria-label={ariaLabel}
    {iconDescription}
    {tooltipPosition}
    {tooltipAlign}
    {disabled}
  >
    <OverflowMenuItem text="Manage credentials" />
    <OverflowMenuItem text="Delete service" />
  </OverflowMenu>
  <OverflowMenu data-testid="neighbor" iconDescription="Rotate keys">
    <OverflowMenuItem text="Rotate now" />
  </OverflowMenu>
  <OverflowMenu data-testid="custom">
    <span slot="menu">Service actions</span>
    <OverflowMenuItem text="Manage credentials" />
  </OverflowMenu>
  <input aria-label="Other control" />
</div>
