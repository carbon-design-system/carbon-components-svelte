<script>
  /** Set to `true` to enable the light variant */
  export let light = false;
</script>

<div
  class:bx--tile="{true}"
  class:bx--tile--light="{light}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</div>
