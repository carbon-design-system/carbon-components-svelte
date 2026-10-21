<svelte:options accessors />

<script lang="ts">
  import FormLabel from "carbon-components-svelte/FormLabel/FormLabel.svelte";
  import type { ComponentProps } from "svelte";

  export let id: ComponentProps<FormLabel>["id"] = undefined;
  export let htmlFor: ComponentProps<FormLabel>["for"] = undefined;
  export let slotContent = "";
  export let onClick: ((event: Event) => void) | undefined = undefined;
  export let onMouseover: ((event: Event) => void) | undefined = undefined;
  export let onMouseenter: ((event: Event) => void) | undefined = undefined;
  export let onMouseleave: ((event: Event) => void) | undefined = undefined;
</script>

<FormLabel
  {id}
  for={htmlFor}
  on:click={(event) => onClick?.(event)}
  on:mouseover={(event) => onMouseover?.(event)}
  on:mouseenter={(event) => onMouseenter?.(event)}
  on:mouseleave={(event) => onMouseleave?.(event)}
  {...$$restProps}
>
  {#if slotContent}
    {slotContent}
  {/if}
  <slot />
</FormLabel>
