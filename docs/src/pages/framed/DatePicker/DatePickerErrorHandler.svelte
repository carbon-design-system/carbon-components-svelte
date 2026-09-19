<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  let invalidText = "";

  const flatpickrProps = {
    errorHandler: (error) => {
      invalidText = error.message;
    },
  };
</script>

<DatePicker
  datePickerType="single"
  {flatpickrProps}
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
