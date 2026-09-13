<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<DatePicker datePickerType="single" flatpickrProps={{ animate: false }}>
  <DatePickerInput labelText="Deployment date" placeholder="mm/dd/yyyy" />
</DatePicker>
