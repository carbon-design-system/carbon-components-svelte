<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  const englishLongShorthand = {
    weekdays: {
      shorthand: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      longhand: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
    },
  };
</script>

<DatePicker datePickerType="single" locale={englishLongShorthand} on:change>
  <DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" />
</DatePicker>
