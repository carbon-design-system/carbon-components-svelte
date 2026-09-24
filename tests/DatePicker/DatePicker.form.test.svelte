<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  export let datePickerType: ComponentProps<DatePicker>["datePickerType"] =
    "single";
  export let value: ComponentProps<DatePicker>["value"] = "";
  export let valueFrom = "";
  export let valueTo = "";
  export let readonly = false;
  export let onChange: (event: CustomEvent) => void = () => {};
  export let oncalendar: (cal: ComponentProps<DatePicker>["calendar"]) => void =
    () => {};

  let calendar: ComponentProps<DatePicker>["calendar"] = null;

  $: oncalendar(calendar);
</script>

<form data-testid="form">
  <DatePicker
    {datePickerType}
    bind:value
    bind:valueFrom
    bind:valueTo
    bind:calendar
    on:change={onChange}
  >
    {#if datePickerType === "range"}
      <DatePickerInput {readonly} labelText="Start" name="start" />
      <DatePickerInput {readonly} labelText="End" name="end" />
    {:else}
      <DatePickerInput {readonly} labelText="Date" name="date" />
    {/if}
  </DatePicker>
</form>
<p data-testid="bound">{value}|{valueFrom}|{valueTo}</p>
