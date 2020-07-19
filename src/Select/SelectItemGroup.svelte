<script>
  export let disabled = false;
  export let label = "Provide label";
</script>

<optgroup {label} {disabled} class:bx--select-optgroup={true} {...$$restProps}>
  <slot />
</optgroup>
