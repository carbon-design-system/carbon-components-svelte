<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<DatePicker datePickerType="month" dateFormat="F Y" on:change>
  <DatePickerInput labelText="Billing month" placeholder="Month Year" />
</DatePicker>
