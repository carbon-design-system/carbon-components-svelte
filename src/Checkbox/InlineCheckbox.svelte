<script>
  /** Specify whether the checkbox is checked */
  export let checked = false;

  /** Specify whether the checkbox is indeterminate */
  export let indeterminate = false;

  /**
   * Specify the title attribute for the label element
   * @type {string}
   */
  export let title = undefined;

  /** Set an id for the input label */
  export let id = "ccs-" + Math.random().toString(36);

  /** Obtain a reference to the input HTML element */
  export let ref = null;
</script>

<div class:bx--checkbox--inline="{true}">
  <input
    bind:this="{ref}"
    type="checkbox"
    class:bx--checkbox="{true}"
    checked="{indeterminate ? false : checked}"
    indeterminate="{indeterminate}"
    id="{id}"
    {...$$restProps}
    aria-checked="{indeterminate ? undefined : checked}"
    on:change
  />
  <label
    for="{id}"
    title="{title}"
    aria-label="{$$props['aria-label']}"
    class:bx--checkbox-label="{true}"></label>
</div>
