<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<DatePicker datePickerType="range" on:change>
  <DatePickerInput labelText="Report period start" placeholder="mm/dd/yyyy" />
  <DatePickerInput labelText="Report period end" placeholder="mm/dd/yyyy" />
</DatePicker>
