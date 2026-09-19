<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  export let renders = 0;
  export let oncalendar: (cal: ComponentProps<DatePicker>["calendar"]) => void =
    () => {};

  let calendar: ComponentProps<DatePicker>["calendar"] = null;

  function isSunday(date: Date) {
    return date.getDay() === 0;
  }

  $: oncalendar(calendar);
</script>

<!-- A new object and array every render, with equal contents. -->
<DatePicker
  datePickerType="single"
  bind:calendar
  flatpickrProps={{ disable: [isSunday, `03/1${renders % 1}/2024`] }}
>
  <DatePickerInput labelText="Date" helperText="Render {renders}" />
</DatePicker>
