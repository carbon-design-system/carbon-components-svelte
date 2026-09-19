<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<div data-testid="fluid-date-picker-single-neutral">
  <DatePicker
    fluid
    datePickerType="single"
    value="03/15/2024"
    flatpickrProps={{ static: true }}
  >
    <DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" />
  </DatePicker>
</div>

<div data-testid="fluid-date-picker-single-readonly">
  <DatePicker
    fluid
    datePickerType="single"
    value="03/15/2024"
    flatpickrProps={{ static: true }}
  >
    <DatePickerInput
      labelText="Meeting date"
      placeholder="mm/dd/yyyy"
      readonly
    />
  </DatePicker>
</div>

<div data-testid="fluid-date-picker-single-invalid">
  <DatePicker
    fluid
    datePickerType="single"
    value="03/15/2024"
    flatpickrProps={{ static: true }}
  >
    <DatePickerInput
      labelText="Meeting date"
      placeholder="mm/dd/yyyy"
      invalid
      invalidText="Date is required"
    />
  </DatePicker>
</div>

<div data-testid="fluid-date-picker-range-neutral">
  <DatePicker fluid datePickerType="range" flatpickrProps={{ static: true }}>
    <DatePickerInput labelText="Start date" placeholder="mm/dd/yyyy" />
    <DatePickerInput labelText="End date" placeholder="mm/dd/yyyy" />
  </DatePicker>
</div>

<div data-testid="fluid-date-picker-range-readonly">
  <DatePicker fluid datePickerType="range" flatpickrProps={{ static: true }}>
    <DatePickerInput labelText="Start date" placeholder="mm/dd/yyyy" readonly />
    <DatePickerInput labelText="End date" placeholder="mm/dd/yyyy" readonly />
  </DatePicker>
</div>

<div data-testid="fluid-date-picker-range-invalid">
  <DatePicker fluid datePickerType="range" flatpickrProps={{ static: true }}>
    <DatePickerInput
      labelText="Start date"
      placeholder="mm/dd/yyyy"
      invalid
      invalidText="Date range is required"
    />
    <DatePickerInput labelText="End date" placeholder="mm/dd/yyyy" />
  </DatePicker>
</div>

<div data-testid="fluid-date-picker-range-warn">
  <DatePicker fluid datePickerType="range" flatpickrProps={{ static: true }}>
    <DatePickerInput
      labelText="Start date"
      placeholder="mm/dd/yyyy"
      warn
      warnText="Date range may be incorrect"
    />
    <DatePickerInput labelText="End date" placeholder="mm/dd/yyyy" />
  </DatePicker>
</div>
