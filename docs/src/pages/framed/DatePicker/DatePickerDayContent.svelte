<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  const now = new Date();
  const events = new Map([
    [5, "Design review"],
    [12, "Sprint planning"],
    [20, "Release"],
  ]);

  function dayDescription(date) {
    if (date.getMonth() !== now.getMonth()) return undefined;
    return events.get(date.getDate());
  }
</script>

<DatePicker datePickerType="single" {dayDescription} on:change>
  <DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" />
</DatePicker>
