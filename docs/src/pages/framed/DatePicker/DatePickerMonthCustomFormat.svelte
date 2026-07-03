<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<DatePicker datePickerType="month" dateFormat="Y-m" on:change>
  <DatePickerInput labelText="Billing month" placeholder="yyyy-mm" />
</DatePicker>
