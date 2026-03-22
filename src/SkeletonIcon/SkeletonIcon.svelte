<script>
  /** @extends {"../SkeletonPlaceholder/SkeletonPlaceholder.svelte"} SkeletonPlaceholderProps */

  import SkeletonPlaceholder from "../SkeletonPlaceholder/SkeletonPlaceholder.svelte";

  /**
   * Specify the icon size.
   * Carbon icons use a 16/20/24/32 scale, but any number (pixels) can be used.
   * @type {(16 | 20 | 24 | 32 | (number & {}))}
   */
  export let size = 16;
</script>

<SkeletonPlaceholder
  {size}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
/>
