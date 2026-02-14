<svelte:options accessors />

<script lang="ts">
  import { ListBoxMenu } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let id: ComponentProps<ListBoxMenu>["id"] = undefined;
  export let ref: ComponentProps<ListBoxMenu>["ref"] = null;
  export let slotContent = "";
  export let onscroll: ((event: Event) => void) | undefined = undefined;
  export let portal: ComponentProps<ListBoxMenu>["portal"] = false;
  export let anchor: ComponentProps<ListBoxMenu>["anchor"] = null;
  export let direction: ComponentProps<ListBoxMenu>["direction"] = "bottom";
  export let open: ComponentProps<ListBoxMenu>["open"] = false;
</script>

<div data-testid="anchor" bind:this={anchor}>Anchor</div>

<ListBoxMenu
  {id}
  bind:ref
  {portal}
  {anchor}
  {direction}
  {open}
  on:scroll={onscroll}
  {...$$restProps}
>
  {#if slotContent}
    {slotContent}
  {/if}
</ListBoxMenu>
