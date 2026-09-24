<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  export let datePickerType: ComponentProps<DatePicker>["datePickerType"] =
    "simple";
  export let dateFormat = "Y-m-d";
  export let value = "";
  export let valueFrom = "";
  export let valueTo = "";
  export let onChange: ((event: CustomEvent) => void) | undefined = undefined;
</script>

<form data-testid="form">
  <DatePicker
    {datePickerType}
    {dateFormat}
    bind:value
    bind:valueFrom
    bind:valueTo
    on:change={(e) => onChange?.(e)}
  >
    <DatePickerInput labelText="Start date" name="tripStart" />
    {#if datePickerType === "range"}
      <DatePickerInput labelText="End date" name="tripEnd" />
    {/if}
  </DatePicker>
</form>
<p data-testid="value">{value}</p>
<p data-testid="valueFrom">{valueFrom}</p>
<p data-testid="valueTo">{valueTo}</p>
