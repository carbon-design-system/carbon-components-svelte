<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<Search>["size"] = undefined;
  export let fluid = false;
  export let selectTextOnFocus = false;
  export let value = "";
  export let loading = false;
  export let loadingDelay = 0;
  export let readonly = false;
  export let helperText = "";
  export let hideLabel = false;
  export let invalid = false;
  export let invalidText = "";
  export let warn = false;
  export let warnText = "";
  export let onClear: () => void = () => {};
</script>

<Search
  bind:value
  {size}
  {fluid}
  {selectTextOnFocus}
  {loading}
  {loadingDelay}
  {readonly}
  {helperText}
  {hideLabel}
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  labelText="Default search"
  placeholder="Search"
  closeButtonLabelText="Clear value"
  on:clear={onClear}
/>

<Search disabled labelText="Disabled search" placeholder="Search disabled..." />
