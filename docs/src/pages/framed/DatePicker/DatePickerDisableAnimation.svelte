<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<DatePicker datePickerType="single" flatpickrProps={{ animate: false }}>
  <DatePickerInput labelText="Date of birth" placeholder="mm/dd/yyyy" />
</DatePicker>
