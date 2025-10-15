<svelte:options accessors />

<script lang="ts">
  import { FormLabel } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let id: ComponentProps<FormLabel>["id"] = undefined;
  export let slotContent = "";
</script>

<FormLabel
  {id}
  on:click={() => console.log("click")}
  on:mouseover={() => console.log("mouseover")}
  on:mouseenter={() => console.log("mouseenter")}
  on:mouseleave={() => console.log("mouseleave")}
  {...$$restProps}
>
  {#if slotContent}
    {slotContent}
  {/if}
  <slot />
</FormLabel>
