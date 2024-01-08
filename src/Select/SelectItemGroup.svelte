<script>
  /** Set to `true` to disable the optgroup element */
  export let disabled = false;

  /** Specify the label attribute of the optgroup element */
  export let label = "Provide label";
</script>

<optgroup
  label="{label}"
  disabled="{disabled}"
  class:cds--select-optgroup="{true}"
  {...$$restProps}
>
  <slot />
</optgroup>
