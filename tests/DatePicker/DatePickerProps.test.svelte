<svelte:options accessors />

<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  export let calendar: ComponentProps<DatePicker>["calendar"] = null;
</script>

<DatePicker datePickerType="single" bind:calendar {...$$restProps}>
  <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
</DatePicker>
