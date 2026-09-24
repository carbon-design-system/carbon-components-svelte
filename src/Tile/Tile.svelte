<script>
  /** Set to `true` to enable the light variant */
  export let light = false;

  /**
   * Set to `true` to stretch the tile to fill the height of its
   * container
   */
  export let fullHeight = false;

  /** Set to `true` to remove the tile's padding */
  export let noPadding = false;
</script>

<div
  class:bx--tile={true}
  class:bx--tile--light={light}
  class:bx--tile--full-height={fullHeight}
  class:bx--tile--no-padding={noPadding}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</div>
