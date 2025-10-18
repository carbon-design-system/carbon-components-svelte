<script lang="ts">
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  export let valueFrom = "";
  export let valueTo = "";
</script>

<DatePicker datePickerType="range" {valueFrom} {valueTo} on:change>
  <DatePickerInput labelText="Start date" placeholder="mm/dd/yyyy" />
  <DatePickerInput labelText="End date" placeholder="mm/dd/yyyy" />
</DatePicker>
