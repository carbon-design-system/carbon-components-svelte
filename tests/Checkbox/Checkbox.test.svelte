<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";

  export let checked = false;
  export let indeterminate = false;
  export let disabled = false;
  export let hideLabel = false;
  export let labelText = "Checkbox label";
  export let helperText = "";
  export let onCheck: (event: CustomEvent<boolean>) => void = () => {};
  export let onClick: (event: MouseEvent) => void = () => {};
</script>

<Checkbox
  bind:checked
  bind:indeterminate
  {disabled}
  {hideLabel}
  {labelText}
  {helperText}
  data-testid="checkbox"
  on:check={onCheck}
  on:click={onClick}
/>
