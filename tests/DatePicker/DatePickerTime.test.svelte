<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  export let datePickerType: ComponentProps<DatePicker>["datePickerType"] =
    "single";
  export let timeGranularity: ComponentProps<DatePicker>["timeGranularity"] =
    "minute";
  export let hourFormat: ComponentProps<DatePicker>["hourFormat"] = "12";
  export let minuteStep = 1;
  export let defaultTime: ComponentProps<DatePicker>["defaultTime"] = "09:00";
  export let value: ComponentProps<DatePicker>["value"] = "";
  export let valueFrom = "";
  export let valueTo = "";
  export let onchange: (event: CustomEvent) => void = () => {};
  export let inline = false;
  export let disabled = false;
  export let readonly = false;
</script>

<DatePicker
  {datePickerType}
  {timeGranularity}
  {hourFormat}
  {minuteStep}
  {defaultTime}
  {inline}
  bind:value
  bind:valueFrom
  bind:valueTo
  on:change={onchange}
>
  {#if datePickerType === "range"}
    <DatePickerInput labelText="Start date" placeholder="mm/dd/yyyy" />
    <DatePickerInput labelText="End date" placeholder="mm/dd/yyyy" />
  {:else}
    <DatePickerInput
      labelText="Date"
      placeholder="mm/dd/yyyy"
      {disabled}
      {readonly}
    />
  {/if}
</DatePicker>
<p data-testid="value">{value}</p>
<p data-testid="range">{valueFrom}|{valueTo}</p>
