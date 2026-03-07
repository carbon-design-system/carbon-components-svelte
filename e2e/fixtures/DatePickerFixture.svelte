<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<DatePicker
  datePickerType="single"
  value="03/15/2024"
  flatpickrProps={{
    static: true,
    minDate: "03/01/2024",
    maxDate: "03/31/2024",
  }}
  on:change
>
  <DatePickerInput
    data-testid="date-picker-meeting"
    labelText="Meeting date"
    placeholder="mm/dd/yyyy"
  />
</DatePicker>
