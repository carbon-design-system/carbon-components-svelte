<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  let value = "";
</script>

<DatePicker
  datePickerType="multiple"
  bind:value
  flatpickrProps={{ conjunction: "; " }}
>
  <DatePickerInput labelText="Blackout dates" placeholder="mm/dd/yyyy" />
</DatePicker>

<p style:margin-top="1rem">Value: {value || "none"}</p>
