<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  let value = "";
</script>

<DatePicker datePickerType="single" bind:value selectedDates={[new Date()]}>
  <DatePickerInput
    labelText="Start date"
    placeholder="mm/dd/yyyy"
    helperText="Value: {value || "none"}"
  />
</DatePicker>
