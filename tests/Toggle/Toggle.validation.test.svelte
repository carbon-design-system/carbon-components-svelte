<script lang="ts">
  import Toggle from "carbon-components-svelte/Toggle/Toggle.svelte";

  export let invalid = false;
  export let invalidText = "Invalid toggle";
  export let warn = false;
  export let warnText = "Warning toggle";
  export let helperText = "";
  export let disabled = false;
  export let readonly = false;
</script>

<Toggle
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  {helperText}
  {disabled}
  {readonly}
  labelText="Validation toggle"
/>
