<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  /** @type {string[]} */
  let singleCloseTriggers = [];
  /** @type {string[]} */
  let rangeCloseTriggers = [];
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
    on:close={(e) =>
      (singleCloseTriggers = [
        ...singleCloseTriggers,
        e.detail?.trigger ?? "null",
      ])}
  >
    <DatePickerInput
      data-testid="date-picker-meeting"
      labelText="Meeting date"
      placeholder="mm/dd/yyyy"
    />
  </DatePicker>
  <p data-testid="date-picker-single-close-triggers">
    {singleCloseTriggers.join(",")}
  </p>
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
    on:close={(e) =>
      (rangeCloseTriggers = [
        ...rangeCloseTriggers,
        e.detail?.trigger ?? "null",
      ])}
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
  <p data-testid="date-picker-range-close-triggers">
    {rangeCloseTriggers.join(",")}
  </p>
</div>

<div data-testid="date-picker-month">
  <DatePicker
    datePickerType="month"
    dateFormat="F Y"
    value="March 2024"
    flatpickrProps={{ static: true }}
    on:change
  >
    <DatePickerInput
      data-testid="date-picker-billing-month"
      labelText="Billing month"
      placeholder="Month Year"
    />
  </DatePicker>
</div>
