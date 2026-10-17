<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  // DatePicker owns the value, type, and fluid; everything else is a
  // DatePickerInput prop, so the contract can treat the pair as one field.
  export let value = "";
  export let fluid = false;
  export let datePickerType: ComponentProps<DatePicker>["datePickerType"] =
    "simple";
</script>

<DatePicker bind:value {fluid} {datePickerType} on:change>
  <DatePickerInput {...$$restProps} on:input>
    <svelte:fragment slot="labelChildren"
      ><slot name="labelChildren" /></svelte:fragment
    >
  </DatePickerInput>
</DatePicker>
