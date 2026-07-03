<script>
  import {
    Button,
    DatePicker,
    DatePickerInput,
    Stack,
  } from "carbon-components-svelte";

  let value = "03/2026";

  function previousMonth() {
    var [month, year] = value.split("/").map(Number);
    var d = new Date(year, month - 2, 1);
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    value = `${mm}/${d.getFullYear()}`;
  }
</script>

<Stack gap={4}>
  <DatePicker datePickerType="month" dateFormat="m/Y" bind:value on:change>
    <DatePickerInput labelText="Billing month" placeholder="mm/yyyy" />
  </DatePicker>
  <Button on:click={previousMonth}>Previous month</Button>
</Stack>
