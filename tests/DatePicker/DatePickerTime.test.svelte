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
</script>

<DatePicker
  datePickerType="single"
  {timeGranularity}
  {hourFormat}
  {minuteStep}
  defaultTime="09:00"
  bind:value
  on:change={onchange}
>
  <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
</DatePicker>
<p data-testid="value">{value}</p>
