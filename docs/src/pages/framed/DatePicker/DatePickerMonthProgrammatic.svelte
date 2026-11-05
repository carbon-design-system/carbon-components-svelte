<script>
  import {
    Button,
    DatePicker,
    DatePickerInput,
    Stack,
  } from "carbon-components-svelte";

  let value = "03/2026";

  function previousMonth() {
    const [month, year] = value.split("/").map(Number);
    const d = new Date(year, month - 2, 1);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    value = `${mm}/${d.getFullYear()}`;
  }
</script>

<Stack gap={4}>
  <DatePicker datePickerType="month" dateFormat="m/Y" bind:value on:change>
    <DatePickerInput labelText="Billing month" placeholder="mm/yyyy" />
  </DatePicker>
  <Button on:click={previousMonth}>Previous month</Button>
</Stack>
