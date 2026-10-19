<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formatDate = (date) => formatter.format(date);
  // Must accept whatever `formatDate` returns.
  const parseDate = (text) => new Date(text);
</script>

<DatePicker datePickerType="single" {formatDate} {parseDate} on:change>
  <DatePickerInput labelText="Meeting date" placeholder="Select a date" />
</DatePicker>
