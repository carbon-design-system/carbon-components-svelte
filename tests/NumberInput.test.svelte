<script lang="ts">
  import { NumberInput, NumberInputSkeleton } from "../types";
  import type { NumberInputProps } from "../types/NumberInput/NumberInput.svelte";

  let value: NumberInputProps["value"] = null;
</script>

{value}

<NumberInput
  disabled
  light
  min="{4}"
  max="{20}"
  value="{4}"
  label="Clusters"
  helperText="Clusters provisioned in your region"
  invalidText="Number must be between 4 and 20."
  on:input="{(e) => {
    console.log({ input: e.detail }); // null | number
  }}"
  on:change="{(e) => {
    console.log({ change: e.detail }); // null | number
  }}"
  on:keydown
  on:keyup
  on:paste
/>

<NumberInput
  disabled
  light
  min="{1}"
  max="{10}"
  value="{4}"
  step="{0.1}"
  label="Clusters"
  helperText="Clusters provisioned in your region"
  invalidText="Number must be between 1 and 10."
  on:input="{(e) => {
    console.log({ input: e.detail }); // null | number
  }}"
  on:change="{(e) => {
    console.log(e.detail); // null | number
  }}"
  on:keydown
  on:keyup
  on:paste
/>

<NumberInputSkeleton hideLabel />
