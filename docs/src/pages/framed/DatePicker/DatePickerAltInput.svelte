<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  let value = "";
</script>

<DatePicker
  datePickerType="single"
  dateFormat="Y-m-d"
  bind:value
  flatpickrProps={{ altInput: true, altFormat: "F j, Y" }}
>
  <DatePickerInput
    labelText="Meeting date"
    placeholder="Select a date"
    helperText="Submitted value: {value || 'none'}"
  />
</DatePicker>
