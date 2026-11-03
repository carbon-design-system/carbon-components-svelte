<script lang="ts">
  import CountryPicker from "carbon-components-svelte/CountryPicker/CountryPicker.svelte";
  import type { ComponentProps } from "svelte";

  export let value = "";
  // "auto" paints a canvas, which jsdom does not have.
  export let flag: ComponentProps<CountryPicker>["flag"] = "none";
  export let onChange: (detail: unknown) => void = () => {};
  export let onClear: () => void = () => {};
</script>

<CountryPicker
  bind:value
  {flag}
  labelText="Country"
  {...$$restProps}
  on:change={(event) => onChange(event.detail)}
  on:clear={() => onClear()}
/>
<output data-testid="bound">{value}</output>
