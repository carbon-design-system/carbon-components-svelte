<script lang="ts">
  import ListItem from "carbon-components-svelte/ListItem/ListItem.svelte";

  export let slotContent = "";
  export let onclick: ((event: MouseEvent) => void) | undefined = undefined;
  export let onmouseover: ((event: MouseEvent) => void) | undefined = undefined;
  export let onmouseenter: ((event: MouseEvent) => void) | undefined =
    undefined;
  export let onmouseleave: ((event: MouseEvent) => void) | undefined =
    undefined;
</script>

<ListItem
  on:click={(e) => onclick?.(e)}
  on:mouseover={(e) => onmouseover?.(e)}
  on:mouseenter={(e) => onmouseenter?.(e)}
  on:mouseleave={(e) => onmouseleave?.(e)}
  {...$$restProps}
>
  {#if slotContent}
    {slotContent}
  {/if}
  <slot />
</ListItem>
