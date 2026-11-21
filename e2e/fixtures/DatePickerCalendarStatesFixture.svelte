<script>
  // Every calendar state the stylesheet draws, open without a click, so the
  // page-wide CSS checks (`check:css:compare`, the layout sweep) see them.
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  /** @param {Date} date */
  const describe = (date) =>
    date.getDate() === 10 || date.getDate() === 12 ? "2 events" : undefined;
</script>

<div class="calendar-states">
  <div data-testid="single">
    <DatePicker
      datePickerType="single"
      inline
      value="11/12/2024"
      minDate="11/03/2024"
      maxDate="11/27/2024"
      disabledDates={["11/18/2024"]}
      dayDescription={describe}
    >
      <DatePickerInput labelText="Single with limits" />
    </DatePicker>
  </div>
  <div data-testid="today">
    <DatePicker datePickerType="single" inline>
      <DatePickerInput labelText="This month" />
    </DatePicker>
  </div>
  <div data-testid="range">
    <DatePicker
      inline
      datePickerType="range"
      valueFrom="11/05/2024"
      valueTo="11/14/2024"
    >
      <DatePickerInput labelText="Range from" />
      <DatePickerInput labelText="Range to" />
    </DatePicker>
  </div>
  <div data-testid="range-pending">
    <DatePicker
      inline
      datePickerType="range"
      valueFrom="11/10/2024"
      minRangeDays={3}
      maxRangeDays={7}
    >
      <DatePickerInput labelText="Pending from" />
      <DatePickerInput labelText="Pending to" />
    </DatePicker>
  </div>
  <div data-testid="multiple">
    <DatePicker inline datePickerType="multiple" value="11/02/2024, 11/21/2024">
      <DatePickerInput labelText="Multiple" />
    </DatePicker>
  </div>
  <div data-testid="week">
    <DatePicker inline datePickerType="week" value="11/10/2024">
      <DatePickerInput labelText="Week" />
    </DatePicker>
  </div>
  <div data-testid="week-numbers-two-months">
    <DatePicker
      datePickerType="single"
      inline
      value="11/30/2024"
      weekNumbers
      months={2}
    >
      <DatePickerInput labelText="Two months" />
    </DatePicker>
  </div>
  <div data-testid="month">
    <DatePicker
      inline
      datePickerType="month"
      dateFormat="F Y"
      value="May 2024"
      minDate="03/01/2024"
    >
      <DatePickerInput labelText="Month" />
    </DatePicker>
  </div>
  <div data-testid="quarter">
    <DatePicker
      inline
      datePickerType="quarter"
      dateFormat="\QQ Y"
      value="Q2 2024"
    >
      <DatePickerInput labelText="Quarter" />
    </DatePicker>
  </div>
  <div data-testid="year">
    <DatePicker
      inline
      datePickerType="year"
      dateFormat="Y"
      value="2024"
      maxDate="12/31/2027"
    >
      <DatePickerInput labelText="Year" />
    </DatePicker>
  </div>
  <div data-testid="year-first-locale">
    <DatePicker datePickerType="single" inline locale="ja" value="11/12/2024">
      <DatePickerInput labelText="Year-first locale" />
    </DatePicker>
  </div>
  <div data-testid="popup" class="calendar-states__popup">
    <DatePicker datePickerType="single" open value="11/12/2024">
      <DatePickerInput labelText="Open popup" />
    </DatePicker>
  </div>
  <div data-testid="popup-fluid" class="calendar-states__popup">
    <DatePicker datePickerType="single" open fluid value="11/12/2024">
      <DatePickerInput labelText="Open fluid popup" />
    </DatePicker>
  </div>
</div>

<style>
  .calendar-states {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    padding: 1rem;
  }

  /* Room below for the popup calendar. */
  .calendar-states__popup {
    min-height: 26rem;
  }
</style>
