<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  export let datePickerType: ComponentProps<DatePicker>["datePickerType"] =
    "single";
  export let dateFormat: ComponentProps<DatePicker>["dateFormat"] = "m/d/Y";
  export let flatpickrProps: ComponentProps<DatePicker>["flatpickrProps"] = {
    static: true,
  };
  export let oncalendar: (cal: ComponentProps<DatePicker>["calendar"]) => void =
    () => {};
  export let onerror: ((event: CustomEvent) => void) | undefined = undefined;

  let calendar: ComponentProps<DatePicker>["calendar"] = null;

  $: oncalendar(calendar);
</script>

{#if datePickerType === "range"}
  <DatePicker
    {datePickerType}
    {dateFormat}
    {flatpickrProps}
    bind:calendar
    on:error={(e) => onerror?.(e)}
  >
    <DatePickerInput labelText="Start date" placeholder="mm/dd/yyyy" />
    <DatePickerInput labelText="End date" placeholder="mm/dd/yyyy" />
  </DatePicker>
{:else}
  <DatePicker
    {datePickerType}
    {dateFormat}
    {flatpickrProps}
    bind:calendar
    on:error={(e) => onerror?.(e)}
  >
    <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
  </DatePicker>
{/if}
