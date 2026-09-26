<script>
  import { DatePicker, DatePickerInput, Stack } from "carbon-components-svelte";

  let value = "";
</script>

<Stack gap={5}>
  <DatePicker
    datePickerType="week"
    displayFormat={"\\W\\e\\e\\k W, Y"}
    bind:value
    on:change
  >
    <DatePickerInput labelText="Sprint week" placeholder="Pick a week" />
  </DatePicker>

  <p>value: {value || "none"}</p>
</Stack>
