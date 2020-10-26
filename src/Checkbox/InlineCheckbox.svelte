<script>
  /**
   * Specify whether the checkbox is checked
   * @type {boolean} [checked=false]
   */
  export let checked = false;

  /**
   * Specify whether the checkbox is indeterminate
   * @type {boolean} [indeterminate=false]
   */
  export let indeterminate = false;

  /**
   * Specify the title attribute for the label element
   * @type {string} [title]
   */
  export let title = undefined;

  /**
   * Set an id for the input label
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Obtain a reference to the input HTML element
   * @type {null | HTMLInputElement} [ref=null]
   */
  export let ref = null;
</script>

<input
  bind:this="{ref}"
  type="checkbox"
  class:bx--checkbox="{true}"
  checked="{indeterminate ? false : checked}"
  indeterminate="{indeterminate}"
  id="{id}"
  {...$$restProps}
  aria-label="{undefined}"
  aria-checked="{indeterminate ? 'mixed' : checked}"
  on:change
/>
<label
  for="{id}"
  title="{title}"
  aria-label="{$$props['aria-label']}"
  class:bx--checkbox-label="{true}"
></label>
