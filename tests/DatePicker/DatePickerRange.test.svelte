<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";

  export let valueFrom = "";
  export let valueTo = "";
  export let readonly = false;
  export let clearable = false;
  export let onchange: ((event: CustomEvent) => void) | undefined = undefined;
  export let onerror: ((event: CustomEvent) => void) | undefined = undefined;
</script>

<DatePicker
  datePickerType="range"
  {valueFrom}
  {valueTo}
  {clearable}
  on:change
  on:change={(e) => onchange?.(e)}
  on:error={(e) => onerror?.(e)}
>
  <DatePickerInput {readonly} labelText="Start date" placeholder="mm/dd/yyyy" />
  <DatePickerInput {readonly} labelText="End date" placeholder="mm/dd/yyyy" />
</DatePicker>
