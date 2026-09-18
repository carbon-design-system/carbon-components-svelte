<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  function formatDate(date) {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${mm}/${dd}/${date.getFullYear()}`;
  }

  const now = new Date();
  const disabledDates = [5, 15, 25].map((day) =>
    formatDate(new Date(now.getFullYear(), now.getMonth(), day)),
  );
</script>

<DatePicker
  datePickerType="single"
  flatpickrProps={{ disable: disabledDates }}
  on:change
>
  <DatePickerInput labelText="Delivery date" placeholder="mm/dd/yyyy" />
</DatePicker>
