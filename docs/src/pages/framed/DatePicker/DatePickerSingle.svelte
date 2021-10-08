<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<DatePicker datePickerType="single" on:change>
  <DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" />
</DatePicker>
