<script>
  /**
   * Set to `true` to use the nested variant
   * @type {boolean} [nested=false]
   */
  export let nested = false;
</script>

<ul
  class:bx--list--unordered="{true}"
  class:bx--list--nested="{nested}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</ul>
