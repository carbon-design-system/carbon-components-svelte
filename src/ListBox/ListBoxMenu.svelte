<script>
  /**
   * Set an id for the top-level element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Obtain a reference to the input HTML element
   * @type {null | HTMLDivElement} [ref=null]
   */
   export let ref = null;
</script>

<div
  bind:this={ref}
  role="listbox"
  id="menu-{id}"
  class:bx--list-box__menu="{true}"
  {...$$restProps}
>
  <slot />
</div>
