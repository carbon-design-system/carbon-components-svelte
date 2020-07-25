<script>
  export let clicked = false;

  /**
   * Set to `true` to enable the light variant
   * @type {boolean} [light=false]
   */
  export let light = false;
</script>

<!-- svelte-ignore a11y-missing-attribute -->
<a
  class:bx--tile={true}
  class:bx--tile--clickable={true}
  class:bx--tile--is-clicked={clicked}
  class:bx--tile--light={light}
  {...$$restProps}
  on:click
  on:click={() => {
    clicked = !clicked;
  }}
  on:keydown
  on:keydown={({ key }) => {
    if (key === ' ' || key === 'Enter') {
      clicked = !clicked;
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <slot />
</a>
