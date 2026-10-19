<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";

  export let checked = false;
  export let indeterminate = false;
  export let disabled = false;
  export let labelText = "Checkbox label";
  export let helperText = "";
  export let onCheck: (event: CustomEvent<boolean>) => void = () => {};
  export let onClick: (event: MouseEvent) => void = () => {};
  export let onChange: (event: Event) => void = () => {};
  export let onFocus: (event: FocusEvent) => void = () => {};
  export let onBlur: (event: FocusEvent) => void = () => {};
  export let tabindex: number | undefined = undefined;
</script>

<Checkbox
  bind:checked
  bind:indeterminate
  {disabled}
  {labelText}
  {helperText}
  {tabindex}
  data-testid="checkbox"
  on:check={onCheck}
  on:click={onClick}
  on:change={onChange}
  on:focus={onFocus}
  on:blur={onBlur}
/>
