<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  export let datePickerType: ComponentProps<DatePicker>["datePickerType"] =
    "single";
  export let value: ComponentProps<DatePicker>["value"] = "";
  export let valueFrom = "";
  export let valueTo = "";
  export let selectedDates: ReadonlyArray<Date> = [];
  export let onchange: (event: CustomEvent) => void = () => {};
  export let ondates: (dates: ReadonlyArray<Date>) => void = () => {};

  $: ondates(selectedDates);
</script>

<form data-testid="form">
  <DatePicker
    {datePickerType}
    bind:value
    bind:valueFrom
    bind:valueTo
    bind:selectedDates
    on:change={onchange}
  >
    {#if datePickerType === "range"}
      <DatePickerInput labelText="Start date" placeholder="mm/dd/yyyy" />
      <DatePickerInput labelText="End date" placeholder="mm/dd/yyyy" />
    {:else}
      <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
    {/if}
  </DatePicker>
</form>
<p data-testid="bound">{value}|{valueFrom}|{valueTo}</p>
<p data-testid="dates">
  {selectedDates.map((date) => date.toDateString()).join(",")}
</p>
