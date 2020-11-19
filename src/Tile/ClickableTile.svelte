<script>
  /** Set to `true` to click the tile */
  export let clicked = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /**
   * Set the `href`
   * @type {string}
   */
  export let href = undefined;
</script>

<!-- svelte-ignore a11y-missing-attribute -->
<a
  class:bx--tile="{true}"
  class:bx--tile--clickable="{true}"
  class:bx--tile--is-clicked="{clicked}"
  class:bx--tile--light="{light}"
  rel="{$$restProps.target === '_blank' ? 'noopener noreferrer' : undefined}"
  {...$$restProps}
  href="{href}"
  on:click
  on:click="{() => {
    clicked = !clicked;
  }}"
  on:keydown
  on:keydown="{({ key }) => {
    if (key === ' ' || key === 'Enter') {
      clicked = !clicked;
    }
  }}"
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</a>
