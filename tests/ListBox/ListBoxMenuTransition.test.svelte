<script lang="ts">
  import ListBoxMenu from "carbon-components-svelte/ListBox/ListBoxMenu.svelte";
  import type { ComponentProps } from "svelte";

  export let open = true;
  export let portal = false;
  export let transition: ComponentProps<ListBoxMenu>["transition"] = undefined;
  export let onOutroStart: () => void = () => {};
  export let onOutroEnd: () => void = () => {};

  let anchor: HTMLElement | null = null;
</script>

<div bind:this={anchor}>Anchor</div>

{#if open}
  <ListBoxMenu
    {portal}
    {anchor}
    {open}
    {transition}
    data-testid="target"
    on:outrostart={onOutroStart}
    on:outroend={onOutroEnd}
  >
    <div role="option" aria-selected="false">Option</div>
  </ListBoxMenu>
{/if}
