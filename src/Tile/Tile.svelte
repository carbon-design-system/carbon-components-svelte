<script>
  /** Set to `true` to enable the light variant */
  export let light = false;

  /**
   * Set the size: `"sm"` for a compact tile, such as a row in a list of
   * choices, with less padding, no minimum height, and the checkmark
   * pulled in. Defaults to the size of a parent tile group.
   * @type {"sm" | "md"}
   */
  export let size = undefined;

  /** Set to `true` to stretch the tile to fill the height of its container */
  export let fullHeight = false;

  /** Set to `true` to remove the tile's padding */
  export let noPadding = false;

  /**
   * Obtain a reference to the top-level HTML element.
   * @bindable readonly
   */
  export let ref = null;
</script>

<div
  bind:this={ref}
  class:bx--tile={true}
  class:bx--tile--light={light}
  class:bx--tile--sm={size === "sm"}
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
