<script>
  /**
   * Set to `true` to use the nested variant
   * @type {boolean} [nested=false]
   */
  export let nested = false;
</script>

<ol
  class:bx--list--ordered="{true}"
  class:bx--list--nested="{nested}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <slot />
</ol>
