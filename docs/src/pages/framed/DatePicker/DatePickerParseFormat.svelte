<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const flatpickrProps = {
    formatDate: (date) => formatter.format(date),
    // Must accept whatever `formatDate` returns.
    parseDate: (dateStr) => new Date(dateStr),
  };
</script>

<DatePicker datePickerType="single" {flatpickrProps} on:change>
  <DatePickerInput labelText="Meeting date" placeholder="Select a date" />
</DatePicker>
