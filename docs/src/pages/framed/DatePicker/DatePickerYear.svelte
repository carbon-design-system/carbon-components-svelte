<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<DatePicker datePickerType="year" dateFormat="Y" on:change>
  <DatePickerInput labelText="Fiscal year" placeholder="yyyy" />
</DatePicker>
