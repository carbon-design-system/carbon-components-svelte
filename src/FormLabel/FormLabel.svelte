<script>
  /**
   * Set an id to be used by the label element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);
</script>

<label
  class:bx--label="{true}"
  for="{id}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <slot />
</label>
