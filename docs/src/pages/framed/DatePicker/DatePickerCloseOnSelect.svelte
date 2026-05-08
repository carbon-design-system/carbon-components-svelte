<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<DatePicker datePickerType="single" flatpickrProps={{ closeOnSelect: false }}>
  <DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" />
</DatePicker>
