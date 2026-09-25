<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<Search>["size"] = undefined;
  export let fluid = false;
  export let selectTextOnFocus = false;
  export let value = "";
  export let loading = false;
  export let readonly = false;
  export let helperText = "";
  export let hideLabel = false;
  export let invalid = false;
  export let invalidText = "";
  export let warn = false;
  export let warnText = "";
</script>

<Search
  bind:value
  {size}
  {fluid}
  {selectTextOnFocus}
  {loading}
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
  on:clear={() => {
    console.log("clear");
  }}
/>

<Search disabled labelText="Disabled search" placeholder="Search disabled..." />
