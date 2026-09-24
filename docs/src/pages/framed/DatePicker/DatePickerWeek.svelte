<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  let value = "";
</script>

<DatePicker
  datePickerType="week"
  displayFormat={"\\W\\e\\e\\k W, Y"}
  bind:value
  on:change
>
  <DatePickerInput labelText="Sprint week" placeholder="Pick a week" />
</DatePicker>

<p style="margin-top: 1rem">value: {value || "none"}</p>
