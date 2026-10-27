<script>
  import {
    AILabel,
    DatePicker,
    DatePickerInput,
  } from "carbon-components-svelte";

  /** @type {string[]} */
  let singleCloseTriggers = [];
  /** @type {string[]} */
  let rangeCloseTriggers = [];
</script>

<div data-testid="date-picker-single">
  <DatePicker
    datePickerType="single"
    value="03/15/2024"
    animate
    minDate="03/01/2024"
    maxDate="03/31/2024"
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

<div data-testid="date-picker-time">
  <DatePicker datePickerType="single" timeGranularity="minute">
    <DatePickerInput
      data-testid="date-picker-time-input"
      labelText="Maintenance starts"
      placeholder="mm/dd/yyyy hh:mm"
    />
  </DatePicker>
</div>

<div data-testid="date-picker-range-time">
  <DatePicker datePickerType="range" timeGranularity="minute">
    <DatePickerInput
      data-testid="date-picker-range-time-input"
      labelText="Freeze starts"
      placeholder="mm/dd/yyyy hh:mm"
    />
    <DatePickerInput labelText="Freeze ends" placeholder="mm/dd/yyyy hh:mm" />
  </DatePicker>
</div>

<div data-testid="outside-date-picker" style="margin-top: 1rem; padding: 1rem;">
  Click target (outside pickers)
</div>

<div data-testid="date-picker-range">
  <DatePicker
    datePickerType="range"
    animate
    minDate="03/01/2024"
    maxDate="03/31/2024"
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

<div data-testid="date-picker-range-limited">
  <DatePicker
    datePickerType="range"
    maxRangeDays={3}
    minDate="03/01/2024"
    maxDate="03/31/2024"
  >
    <DatePickerInput
      data-testid="date-picker-range-limited-start"
      labelText="Trip start"
      placeholder="mm/dd/yyyy"
    />
    <DatePickerInput labelText="Trip end" placeholder="mm/dd/yyyy" />
  </DatePicker>
</div>

<div data-testid="date-picker-calendar-only">
  <DatePicker datePickerType="single" allowInput={false}>
    <DatePickerInput
      data-testid="date-picker-calendar-only-input"
      labelText="Ship date"
      placeholder="mm/dd/yyyy"
    />
  </DatePicker>
</div>

<div data-testid="date-picker-month">
  <DatePicker
    datePickerType="month"
    dateFormat="F Y"
    value="March 2024"
    on:change
  >
    <DatePickerInput
      data-testid="date-picker-billing-month"
      labelText="Billing month"
      placeholder="Month Year"
    />
  </DatePicker>
</div>

<div data-testid="date-picker-multiple">
  <DatePicker
    datePickerType="multiple"
    value="09/09/2026, 09/10/2026, 09/11/2026, 09/12/2026, 09/13/2026"
    on:change
  >
    <DatePickerInput
      data-testid="date-picker-blackout-dates"
      labelText="Blackout dates"
      placeholder="mm/dd/yyyy"
    />
  </DatePicker>
</div>

<div data-testid="date-picker-fluid-readonly-single">
  <DatePicker
    fluid
    datePickerType="single"
    value="03/15/2024"
    minDate="03/01/2024"
    maxDate="03/31/2024"
  >
    <DatePickerInput
      data-testid="date-picker-fluid-readonly-single-input"
      labelText="Readonly appointment"
      placeholder="mm/dd/yyyy"
      readonly
    />
  </DatePicker>
</div>

<div data-testid="date-picker-fluid-readonly-range">
  <DatePicker
    fluid
    datePickerType="range"
    minDate="03/01/2024"
    maxDate="03/31/2024"
  >
    <DatePickerInput
      data-testid="date-picker-fluid-readonly-range-start"
      labelText="Readonly from"
      placeholder="mm/dd/yyyy"
      readonly
    />
    <DatePickerInput
      data-testid="date-picker-fluid-readonly-range-end"
      labelText="Readonly to"
      placeholder="mm/dd/yyyy"
      readonly
    />
  </DatePicker>
</div>

<div data-testid="date-picker-fluid-invalid-range">
  <DatePicker
    fluid
    datePickerType="range"
    minDate="03/01/2024"
    maxDate="03/31/2024"
  >
    <DatePickerInput
      data-testid="date-picker-fluid-invalid-range-start"
      labelText="Invalid from"
      placeholder="mm/dd/yyyy"
      invalid
      invalidText="Enter a valid start date"
    />
    <DatePickerInput
      data-testid="date-picker-fluid-invalid-range-end"
      labelText="Invalid to"
      placeholder="mm/dd/yyyy"
      invalid
      invalidText="Enter a valid end date"
    />
  </DatePicker>
</div>

<div data-testid="date-picker-full-width" style:width="400px">
  <DatePicker fullWidth datePickerType="single" value="03/15/2024">
    <DatePickerInput labelText="Invoice due" placeholder="mm/dd/yyyy" />
  </DatePicker>
  <DatePicker fullWidth datePickerType="simple" short>
    <DatePickerInput labelText="Renewal" placeholder="mm/dd" />
  </DatePicker>
  <DatePicker fullWidth datePickerType="simple">
    <DatePickerInput
      labelText="Contract start"
      placeholder="mm/dd/yyyy"
      invalid
      invalidText="Pick a date after today."
    />
  </DatePicker>
  <DatePicker
    fullWidth
    datePickerType="range"
    valueFrom="03/04/2024"
    valueTo="03/08/2024"
  >
    <DatePickerInput labelText="Pick-up" placeholder="mm/dd/yyyy" />
    <DatePickerInput labelText="Return" placeholder="mm/dd/yyyy" />
  </DatePicker>
</div>

<div data-testid="date-picker-clear-ai-label">
  <DatePicker datePickerType="single" clearable value="03/15/2024">
    <DatePickerInput
      labelText="Renewal date"
      placeholder="mm/dd/yyyy"
      invalid
      invalidText="Pick a date after today."
    >
      <AILabel slot="decorator">
        <p>Estimated from your current usage trend.</p>
      </AILabel>
    </DatePickerInput>
  </DatePicker>
  <DatePicker datePickerType="simple" clearable value="03/15/2024">
    <DatePickerInput
      labelText="Trial end"
      placeholder="mm/dd/yyyy"
      warn
      warnText="Falls on a weekend."
    >
      <AILabel slot="decorator">
        <p>Estimated from your current usage trend.</p>
      </AILabel>
    </DatePickerInput>
  </DatePicker>
</div>
