<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  export let datePickerType: ComponentProps<DatePicker>["datePickerType"] =
    "single";
  export let oncalendar: (cal: ComponentProps<DatePicker>["calendar"]) => void =
    () => {};

  let calendar: ComponentProps<DatePicker>["calendar"] = null;

  $: oncalendar(calendar);
</script>

{#if datePickerType === "range"}
  <DatePicker {datePickerType} bind:calendar>
    <DatePickerInput labelText="Start date" placeholder="mm/dd/yyyy" />
    <DatePickerInput labelText="End date" placeholder="mm/dd/yyyy" />
  </DatePicker>
{:else}
  <DatePicker {datePickerType} bind:calendar>
    <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
  </DatePicker>
{/if}
