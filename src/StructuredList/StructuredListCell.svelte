<script>
  /** Set to `true` to use as a header */
  export let head = false;

  /** Set to `true` to prevent wrapping */
  export let noWrap = false;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  role="{head ? 'columnheader' : 'cell'}"
  class:cds--structured-list-th="{head}"
  class:cds--structured-list-td="{!head}"
  class:cds--structured-list-content--nowrap="{noWrap}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</div>
