<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  export let timeGranularity: ComponentProps<DatePicker>["timeGranularity"] =
    "minute";
  export let hourFormat: ComponentProps<DatePicker>["hourFormat"] = "12";
  export let minuteStep = 1;
  export let value: ComponentProps<DatePicker>["value"] = "";
  export let onchange: (event: CustomEvent) => void = () => {};
  export let inline = false;
  export let disabled = false;
  export let readonly = false;
</script>

<DatePicker
  datePickerType="single"
  {timeGranularity}
  {hourFormat}
  {minuteStep}
  defaultTime="09:00"
  {inline}
  bind:value
  on:change={onchange}
>
  <DatePickerInput
    labelText="Date"
    placeholder="mm/dd/yyyy"
    {disabled}
    {readonly}
  />
</DatePicker>
<p data-testid="value">{value}</p>
