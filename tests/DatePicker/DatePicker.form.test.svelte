<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { ComponentProps } from "svelte";

  export let datePickerType: ComponentProps<DatePicker>["datePickerType"] =
    "simple";
  export let dateFormat = "Y-m-d";
  export let valueFrom = "";
  export let valueTo = "";
</script>

<form data-testid="form">
  <DatePicker {datePickerType} {dateFormat} bind:valueFrom bind:valueTo>
    <DatePickerInput labelText="Start date" name="tripStart" />
    {#if datePickerType === "range"}
      <DatePickerInput labelText="End date" name="tripEnd" />
    {/if}
  </DatePicker>
</form>
<p data-testid="valueFrom">{valueFrom}</p>
<p data-testid="valueTo">{valueTo}</p>
