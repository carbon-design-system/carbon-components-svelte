<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<div style="display: flex; flex-wrap: wrap; gap: 2rem">
  <DatePicker
    datePickerType="single"
    value="01/15/2024"
    clearable
    on:clear={() => console.log("cleared")}
  >
    <DatePickerInput labelText="Delivery date" placeholder="mm/dd/yyyy" />
  </DatePicker>
  <DatePicker
    datePickerType="range"
    valueFrom="01/10/2024"
    valueTo="01/20/2024"
    clearable
  >
    <DatePickerInput labelText="Check-in" placeholder="mm/dd/yyyy" />
    <DatePickerInput labelText="Check-out" placeholder="mm/dd/yyyy" />
  </DatePicker>
</div>
