<script>
  /** Set the size of the icon */
  export let size = 16;
</script>

<!-- @component
@deprecated This component is deprecated.
-->

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class:bx--icon--skeleton="{true}"
  {...$$restProps}
  style="{$$restProps.style}; width: {size}px; height: {size}px"
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
></div>
