<script>
  import {
    DatePicker,
    DatePickerInput,
    datePresets,
  } from "carbon-components-svelte";

  /** The first day of next week, by the calendar's own week start. */
  function startOfNextWeek({ today, firstDayOfWeek }) {
    const offset = (today.getDay() - firstDayOfWeek + 7) % 7;
    return new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - offset + 7,
    );
  }

  /** Two weeks from today, the default review window. */
  function inTwoWeeks({ today }) {
    return new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 14,
    );
  }

  const presets = [
    { label: "Today", value: datePresets.today },
    { label: "Start of next week", value: startOfNextWeek },
    { label: "In two weeks", value: inTwoWeeks },
  ];
</script>

<DatePicker datePickerType="single" {presets} firstDayOfWeek={1}>
  <DatePickerInput labelText="Access review due" placeholder="mm/dd/yyyy" />
</DatePicker>
