<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  const start = new Date(2025, 0, 1);
  const end = new Date(2025, 11, 31);
</script>

<DatePicker datePickerType="single" minDate={start} maxDate={end} on:change>
  <DatePickerInput labelText="Date (2025 only)" placeholder="mm/dd/yyyy" />
</DatePicker>
