<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  export let datePickerType: ComponentProps<DatePicker>["datePickerType"] =
    "range";
  export let presets: ComponentProps<DatePicker>["presets"] = [];
  export let value = "";
  export let valueFrom = "";
  export let valueTo = "";
  export let maxDate: ComponentProps<DatePicker>["maxDate"] = null;
  export let onchange: (event: CustomEvent) => void = () => {};
</script>

<DatePicker
  {datePickerType}
  {presets}
  {maxDate}
  bind:value
  bind:valueFrom
  bind:valueTo
  on:change={onchange}
>
  <DatePickerInput labelText="Start" />
  {#if datePickerType === "range"}
    <DatePickerInput labelText="End" />
  {/if}
</DatePicker>
<p data-testid="value">
  {datePickerType === "range" ? `${valueFrom} - ${valueTo}` : value}
</p>
