<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<DatePicker
  datePickerType="single"
  flatpickrProps={{ shorthandCurrentMonth: true }}
  on:change
>
  <DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" />
</DatePicker>
