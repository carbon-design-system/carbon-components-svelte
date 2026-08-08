<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";

  export let invalid = false;
  export let invalidText = "Invalid checkbox";
  export let warn = false;
  export let warnText = "Warning checkbox";
  export let disabled = false;
  export let readonly = false;
  export let helperText = "";
</script>

<Checkbox
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  {disabled}
  {readonly}
  {helperText}
  labelText="Validation checkbox"
  data-testid="checkbox"
/>
