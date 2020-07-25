<script>
  /**
   * Set an id for the top-level element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);
</script>

<div
  role="listbox"
  id="menu-{id}"
  class:bx--list-box__menu={true}
  {...$$restProps}>
  <slot />
</div>
