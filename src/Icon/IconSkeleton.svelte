<script>
  /** Set the size of the icon */
  export let size = 16;
</script>

<div
  class:bx--icon--skeleton="{true}"
  {...$$restProps}
  style="{$$restProps.style}; width: {size}px; height: {size}px"
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
></div>
