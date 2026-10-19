<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  let value = "";
</script>

<DatePicker datePickerType="multiple" bind:value conjunction="; ">
  <DatePickerInput
    labelText="Blackout dates"
    placeholder="mm/dd/yyyy"
    helperText="Value: {value || "none"}"
  />
</DatePicker>
