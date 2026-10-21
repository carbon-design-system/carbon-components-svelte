<script lang="ts">
  import FormItem from "carbon-components-svelte/FormItem/FormItem.svelte";

  export let slotContent = "";
  export let onClick: ((event: Event) => void) | undefined = undefined;
  export let onMouseover: ((event: Event) => void) | undefined = undefined;
  export let onMouseenter: ((event: Event) => void) | undefined = undefined;
  export let onMouseleave: ((event: Event) => void) | undefined = undefined;
</script>

<FormItem
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
</FormItem>
