<script lang="ts">
  import SkeletonPlaceholder from "carbon-components-svelte/SkeletonPlaceholder/SkeletonPlaceholder.svelte";

  export let onclick: ((event: MouseEvent) => void) | undefined = undefined;
  export let onmouseover: ((event: MouseEvent) => void) | undefined = undefined;
  export let onmouseenter: ((event: MouseEvent) => void) | undefined =
    undefined;
  export let onmouseleave: ((event: MouseEvent) => void) | undefined =
    undefined;
</script>

<SkeletonPlaceholder
  data-testid="skeleton-placeholder"
  {...$$restProps}
  on:click={(e) => onclick?.(e)}
  on:mouseover={(e) => onmouseover?.(e)}
  on:mouseenter={(e) => onmouseenter?.(e)}
  on:mouseleave={(e) => onmouseleave?.(e)}
/>
