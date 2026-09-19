<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  // Deliveries only run on Monday, Wednesday, and Friday.
  const enable = [(date) => [1, 3, 5].includes(date.getDay())];
</script>

<DatePicker datePickerType="single" flatpickrProps={{ enable }} on:change>
  <DatePickerInput labelText="Delivery date" placeholder="mm/dd/yyyy" />
</DatePicker>
