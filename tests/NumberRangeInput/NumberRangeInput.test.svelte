<svelte:options accessors />

<script lang="ts">
  import NumberRangeInput from "carbon-components-svelte/NumberRangeInput/NumberRangeInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<NumberRangeInput>["value"] = [null, null];
  export let valid = true;
  export let labelText = "Price";
  export let onInput: (detail: unknown) => void = () => {};
  export let onChange: (detail: unknown) => void = () => {};
</script>

<NumberRangeInput
  bind:value
  bind:valid
  {labelText}
  {...$$restProps}
  on:input={(event) => onInput(event.detail)}
  on:change={(event) => onChange(event.detail)}
/>
