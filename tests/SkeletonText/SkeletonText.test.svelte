<script lang="ts">
  import SkeletonText from "carbon-components-svelte/SkeletonText/SkeletonText.svelte";

  export let lines = 3;
  export let heading = false;
  export let paragraph = false;
  export let width = "100%";
  export let noMargin = false;
  export let onclick: ((event: MouseEvent) => void) | undefined = undefined;
  export let onmouseover: ((event: MouseEvent) => void) | undefined = undefined;
  export let onmouseenter: ((event: MouseEvent) => void) | undefined =
    undefined;
  export let onmouseleave: ((event: MouseEvent) => void) | undefined =
    undefined;
</script>

<SkeletonText
  {lines}
  {heading}
  {paragraph}
  {width}
  {noMargin}
  on:click={(e) => onclick?.(e)}
  on:mouseover={(e) => onmouseover?.(e)}
  on:mouseenter={(e) => onmouseenter?.(e)}
  on:mouseleave={(e) => onmouseleave?.(e)}
/>
