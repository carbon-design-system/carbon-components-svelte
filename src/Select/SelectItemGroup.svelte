<script>
  /**
   * Set to `true` to disable the optgroup element
   * @type {boolean} [disabled=false]
   */
  export let disabled = false;

  /**
   * Specify the label attribute of the optgroup element
   * @type {string} [label="Provide label"]
   */
  export let label = "Provide label";
</script>

<optgroup
  label="{label}"
  disabled="{disabled}"
  class:bx--select-optgroup="{true}"
  {...$$restProps}
>
  <slot />
</optgroup>
