<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<DatePicker datePickerType="single" allowInput={false} on:change>
  <DatePickerInput labelText="Ship date" placeholder="mm/dd/yyyy" />
</DatePicker>
