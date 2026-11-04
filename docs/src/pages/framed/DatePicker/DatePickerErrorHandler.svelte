<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  let invalidText = "";
</script>

<DatePicker
  datePickerType="single"
  on:error={(e) => (invalidText = e.detail.error.message)}
  on:change={(e) => {
    // Before the calendar is ready, the detail is the input's text.
    if (typeof e.detail !== "string" && e.detail.selectedDates.length > 0)
      invalidText = "";
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
