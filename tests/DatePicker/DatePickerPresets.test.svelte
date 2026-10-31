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
  export let inline = false;
  export let disabled = false;
</script>

<DatePicker
  {datePickerType}
  {presets}
  {maxDate}
  {inline}
  bind:value
  bind:valueFrom
  bind:valueTo
  on:change={onchange}
>
  <DatePickerInput labelText="Start" {disabled} />
  {#if datePickerType === "range"}
    <DatePickerInput labelText="End" {disabled} />
  {/if}
</DatePicker>
<p data-testid="value">
  {datePickerType === "range" ? `${valueFrom} - ${valueTo}` : value}
</p>
