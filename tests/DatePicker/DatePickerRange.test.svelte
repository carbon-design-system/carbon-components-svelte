<script lang="ts">
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  export let valueFrom = "";
  export let valueTo = "";
  export let readonly = false;
</script>

<DatePicker datePickerType="range" {valueFrom} {valueTo} on:change>
  <DatePickerInput {readonly} labelText="Start date" placeholder="mm/dd/yyyy" />
  <DatePickerInput {readonly} labelText="End date" placeholder="mm/dd/yyyy" />
</DatePicker>
