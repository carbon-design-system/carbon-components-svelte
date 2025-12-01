<svelte:options accessors />

<script lang="ts">
  import { ListBoxMenu } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let id: ComponentProps<ListBoxMenu>["id"] = undefined;
  export let ref: ComponentProps<ListBoxMenu>["ref"] = null;
  export let slotContent = "";
  export let onscroll: ((event: Event) => void) | undefined = undefined;
</script>

<ListBoxMenu {id} bind:ref on:scroll={onscroll} {...$$restProps}>
  {#if slotContent}
    {slotContent}
  {/if}
</ListBoxMenu>
