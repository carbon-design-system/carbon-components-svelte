<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  export let datePickerType: ComponentProps<DatePicker>["datePickerType"] =
    "single";
  export let months: ComponentProps<DatePicker>["months"] = 1;
</script>

<DatePicker {datePickerType} {months} inline value="">
  <DatePickerInput labelText="Date" />
  {#if datePickerType === "range"}
    <DatePickerInput labelText="End date" />
  {/if}
</DatePicker>
