<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<div data-testid="date-picker-single">
  <DatePicker
    datePickerType="single"
    value="03/15/2024"
    flatpickrProps={{
      static: true,
      minDate: "03/01/2024",
      maxDate: "03/31/2024",
    }}
    on:change
  >
    <DatePickerInput
      data-testid="date-picker-meeting"
      labelText="Meeting date"
      placeholder="mm/dd/yyyy"
    />
  </DatePicker>
</div>

<div data-testid="outside-date-picker" style="margin-top: 1rem; padding: 1rem;">
  Click target (outside pickers)
</div>

<div data-testid="date-picker-range">
  <DatePicker
    datePickerType="range"
    flatpickrProps={{
      static: true,
      minDate: "03/01/2024",
      maxDate: "03/31/2024",
    }}
    on:change
  >
    <DatePickerInput
      data-testid="date-picker-range-start"
      labelText="Start date"
      placeholder="mm/dd/yyyy"
    />
    <DatePickerInput
      data-testid="date-picker-range-end"
      labelText="End date"
      placeholder="mm/dd/yyyy"
    />
  </DatePicker>
</div>
