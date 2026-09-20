<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  export let datePickerType: ComponentProps<DatePicker>["datePickerType"] =
    "single";
  export let displayFormat: ComponentProps<DatePicker>["displayFormat"] =
    "F j, Y";
  // `undefined` would fall back to the default above, so toggle separately.
  export let enabled = true;
  export let value = "2024-03-15";
  export let disabled = false;
  export let onfocus: ((event: FocusEvent) => void) | undefined = undefined;
  export let onkeydown: ((event: KeyboardEvent) => void) | undefined =
    undefined;
</script>

<form data-testid="form">
  <DatePicker
    {datePickerType}
    dateFormat="Y-m-d"
    displayFormat={enabled ? displayFormat : undefined}
    bind:value
  >
    <DatePickerInput
      labelText="Date"
      name="meeting"
      {disabled}
      on:focus={(e) => onfocus?.(e)}
      on:keydown={(e) => onkeydown?.(e)}
    />
    {#if datePickerType === "range"}
      <DatePickerInput labelText="End date" />
    {/if}
  </DatePicker>
</form>

<p data-testid="value">{value}</p>
