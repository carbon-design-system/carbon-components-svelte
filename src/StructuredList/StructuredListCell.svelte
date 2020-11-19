<script>
  /** Set to `true` to use as a header */
  export let head = false;

  /** Set to `true` to prevent wrapping */
  export let noWrap = false;
</script>

<div
  class:bx--structured-list-th="{head}"
  class:bx--structured-list-td="{!head}"
  class:bx--structured-list-content--nowrap="{noWrap}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</div>
