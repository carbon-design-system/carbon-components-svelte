<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<DatePicker datePickerType="single" weekNumbers on:change>
  <DatePickerInput labelText="Sprint start" placeholder="mm/dd/yyyy" />
</DatePicker>
