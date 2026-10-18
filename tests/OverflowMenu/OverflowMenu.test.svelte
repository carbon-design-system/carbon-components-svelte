<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let disabled: ComponentProps<OverflowMenu>["disabled"] = false;
  export let direction: ComponentProps<OverflowMenu>["direction"] = "bottom";
  export let id: ComponentProps<OverflowMenu>["id"] = `ccs-${Math.random().toString(36)}`;
  export let portalMenu: ComponentProps<OverflowMenu>["portalMenu"] = false;
  export let maxHeight: ComponentProps<OverflowMenu>["maxHeight"] = undefined;
  export let ariaLabel: ComponentProps<OverflowMenu>["aria-label"] = undefined;
  export let open = false;

  /** Called with each `close` event and the fixture's `open` at dispatch time. */
  export let onClose: (e: CustomEvent, open: boolean) => void = () => {};
  /** Called with the text of each clicked item. */
  export let onItemClick: (text: string) => void = () => {};
  /** Cancels every `close` event. */
  export let cancelClose = false;
  /** Cancels the "Manage credentials" item click, which keeps the menu open. */
  export let preventItemClick = false;
  /** Disables the "API documentation" link item. */
  export let disabledLink = false;
  export let withNextField = false;
</script>

<OverflowMenu
  bind:open
  aria-label={ariaLabel}
  {disabled}
  {direction}
  {id}
  {portalMenu}
  {maxHeight}
  on:close={(e) => {
    if (cancelClose) e.preventDefault();
    onClose(e, open);
  }}
>
  <OverflowMenuItem
    text="Manage credentials"
    on:click={(e) => {
      onItemClick("Manage credentials");
      if (preventItemClick) e.preventDefault();
    }}
  />
  <OverflowMenuItem
    disabled={disabledLink}
    href="https://cloud.ibm.com/docs/api-gateway/"
    target="_blank"
    text="API documentation"
    on:click={() => onItemClick("API documentation")}
  />
  <OverflowMenuItem
    danger
    text="Delete service"
    on:click={() => onItemClick("Delete service")}
  />
</OverflowMenu>
{#if withNextField}
  <input aria-label="Next field">
{/if}
