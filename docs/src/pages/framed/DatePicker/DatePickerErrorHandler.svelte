<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  let invalidText = "";
</script>

<DatePicker
  datePickerType="single"
  on:error={(e) => (invalidText = e.detail.error.message)}
  on:change={(e) => {
    if (e.detail.selectedDates.length > 0) invalidText = "";
  }}
>
  <DatePickerInput
    labelText="Meeting date"
    helperText='Type "tomorrow-ish" and press Enter'
    placeholder="mm/dd/yyyy"
    invalid={!!invalidText}
    {invalidText}
  />
</DatePicker>
