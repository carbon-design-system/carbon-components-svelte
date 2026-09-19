<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  let selectedCount = 0;

  function handleChange(event) {
    selectedCount = event.detail.selectedDates.length;
  }
</script>

<DatePicker datePickerType="multiple" on:change={handleChange}>
  <DatePickerInput
    labelText="Blackout dates"
    placeholder="mm/dd/yyyy"
    helperText={`${selectedCount} date${selectedCount === 1 ? "" : "s"} selected`}
  />
</DatePicker>
