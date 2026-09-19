<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  const now = new Date();
  const conferenceMonth = new Date(now.getFullYear(), now.getMonth() + 6, 1);
</script>

<DatePicker datePickerType="single" initialMonth={conferenceMonth}>
  <DatePickerInput labelText="Conference date" placeholder="mm/dd/yyyy" />
</DatePicker>
