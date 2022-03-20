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
  on:change="{(e) => {
    console.log(e.detail); // null | number
  }}"
/>

<NumberInputSkeleton hideLabel />
