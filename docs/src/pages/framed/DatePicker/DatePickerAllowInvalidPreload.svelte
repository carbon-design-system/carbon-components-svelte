<script>
  import { DatePicker, DatePickerInput, Stack } from "carbon-components-svelte";

  const minDate = new Date(2025, 0, 1);
</script>

<Stack gap={6}>
  <DatePicker datePickerType="single" value="12/15/2024" {minDate}>
    <DatePickerInput labelText="Default (cleared)" placeholder="mm/dd/yyyy" />
  </DatePicker>
  <DatePicker
    datePickerType="single"
    value="12/15/2024"
    {minDate}
    flatpickrProps={{ allowInvalidPreload: true }}
  >
    <DatePickerInput
      labelText="allowInvalidPreload (kept)"
      placeholder="mm/dd/yyyy"
    />
  </DatePicker>
</Stack>
