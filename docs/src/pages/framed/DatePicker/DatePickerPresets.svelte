<script>
  import {
    DatePicker,
    DatePickerInput,
    datePresets,
    Stack,
  } from "carbon-components-svelte";

  const presets = [
    { label: "Today", value: datePresets.today },
    { label: "Yesterday", value: datePresets.yesterday },
    { label: "Last 7 days", value: datePresets.lastDays(7) },
    { label: "Last 30 days", value: datePresets.lastDays(30) },
    { label: "This month", value: datePresets.thisMonth },
    { label: "Last month", value: datePresets.lastMonth },
    { label: "Year to date", value: datePresets.yearToDate },
  ];

  let valueFrom = "";
  let valueTo = "";
</script>

<Stack gap={5}>
  <DatePicker datePickerType="range" {presets} bind:valueFrom bind:valueTo>
    <DatePickerInput labelText="Report period start" placeholder="mm/dd/yyyy" />
    <DatePickerInput labelText="Report period end" placeholder="mm/dd/yyyy" />
  </DatePicker>
  <p>Report period: {valueFrom || "none"} to {valueTo || "none"}</p>
</Stack>
