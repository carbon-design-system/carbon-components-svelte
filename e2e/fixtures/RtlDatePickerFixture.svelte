<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<!-- Inline calendars, then pickers that open a calendar. Each sits at the
     page's inline start, so in RTL every part mirrors across the page. -->
<div class="cases">
  <div data-testid="single">
    <DatePicker datePickerType="single" inline value="03/15/2024">
      <DatePickerInput labelText="Start date" />
    </DatePicker>
  </div>
  <div data-testid="range">
    <DatePicker
      datePickerType="range"
      inline
      valueFrom="03/12/2024"
      valueTo="03/14/2024"
    >
      <DatePickerInput labelText="Start date" />
      <DatePickerInput labelText="End date" />
    </DatePicker>
  </div>
  <div data-testid="month">
    <DatePicker datePickerType="month" inline value="March 2024">
      <DatePickerInput labelText="Billing month" />
    </DatePicker>
  </div>
  <!-- Narrower than the calendar, so it overhangs the field. -->
  <div class="narrow" data-testid="static">
    <DatePicker datePickerType="single" value="03/15/2024">
      <DatePickerInput labelText="Start date" />
    </DatePicker>
  </div>
  <div class="narrow" data-testid="portal">
    <DatePicker datePickerType="single" portalMenu value="03/15/2024">
      <DatePickerInput labelText="Start date" />
    </DatePicker>
  </div>
  <div class="narrow inset" data-testid="portal-inset">
    <DatePicker datePickerType="single" portalMenu value="03/15/2024">
      <DatePickerInput labelText="Start date" />
    </DatePicker>
  </div>
  <!-- The time row's fields read left to right in either direction. -->
  <div data-testid="time-row">
    <DatePicker
      datePickerType="single"
      inline
      timeGranularity="minute"
      value="03/15/2024 2:30 PM"
    >
      <DatePickerInput labelText="Start time" />
    </DatePicker>
  </div>
  <!-- At the inline end: the calendar lines up with the field's far edge
       to stay in view. -->
  <div class="end">
    <div class="narrow" data-testid="portal-end">
      <DatePicker datePickerType="single" portalMenu value="03/15/2024">
        <DatePickerInput labelText="Start date" />
      </DatePicker>
    </div>
  </div>
  <!-- A time mixes letters and digits, which bidi reorders in RTL. -->
  <div data-testid="time">
    <DatePicker
      datePickerType="single"
      dateFormat="m/d/Y h:i K"
      value="03/15/2024 2:30 PM"
    >
      <DatePickerInput labelText="Maintenance window" />
    </DatePicker>
  </div>
  <div data-testid="time-multiple">
    <DatePicker
      datePickerType="multiple"
      dateFormat="m/d/Y h:i K"
      value="03/15/2024 2:30 PM"
    >
      <DatePickerInput labelText="Maintenance windows" />
    </DatePicker>
  </div>
</div>

<style>
  .cases > :global(div) {
    margin-bottom: 1rem;
  }

  .narrow {
    width: 9rem;
  }

  .inset {
    margin-inline-start: 20rem;
  }

  .end {
    display: flex;
    justify-content: flex-end;
  }
</style>
