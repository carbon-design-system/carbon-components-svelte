<script>
  import {
    Button,
    DatePicker,
    DatePickerInput,
    Stack,
  } from "carbon-components-svelte";

  let value = "";
  let calendar = null;

  function selectCurrentYear() {
    value = String(new Date().getFullYear());
  }

  function viewNextDecade() {
    calendar?.changeYear(calendar.currentYear + 10);
  }
</script>

<Stack gap={4}>
  <DatePicker
    datePickerType="year"
    dateFormat="Y"
    bind:value
    bind:calendar
    on:change
  >
    <DatePickerInput labelText="Fiscal year" placeholder="yyyy" />
  </DatePicker>
  <Stack gap={3} orientation="horizontal">
    <Button kind="tertiary" on:click={selectCurrentYear}>
      Select current year
    </Button>
    <Button kind="tertiary" on:click={viewNextDecade}>
      View next decade
    </Button>
  </Stack>
</Stack>
