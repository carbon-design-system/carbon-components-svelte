<script lang="ts">
  import SkeletonIcon from "carbon-components-svelte/SkeletonIcon/SkeletonIcon.svelte";

  export let onclick: ((event: MouseEvent) => void) | undefined = undefined;
  export let onmouseover: ((event: MouseEvent) => void) | undefined = undefined;
  export let onmouseenter: ((event: MouseEvent) => void) | undefined =
    undefined;
  export let onmouseleave: ((event: MouseEvent) => void) | undefined =
    undefined;
</script>

<SkeletonIcon
  data-testid="skeleton-icon"
  {...$$restProps}
  on:click={(e) => onclick?.(e)}
  on:mouseover={(e) => onmouseover?.(e)}
  on:mouseenter={(e) => onmouseenter?.(e)}
  on:mouseleave={(e) => onmouseleave?.(e)}
/>
