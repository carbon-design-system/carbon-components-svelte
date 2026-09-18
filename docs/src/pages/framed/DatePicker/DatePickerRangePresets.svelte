<script>
  import {
    Button,
    DatePicker,
    DatePickerInput,
    Stack,
  } from "carbon-components-svelte";

  let valueFrom = "";
  let valueTo = "";

  function formatDate(date) {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${mm}/${dd}/${date.getFullYear()}`;
  }

  function selectLastDays(days) {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    valueFrom = formatDate(from);
    valueTo = formatDate(to);
  }

  function selectThisMonth() {
    const now = new Date();
    valueFrom = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
    valueTo = formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  }
</script>

<Stack gap={4}>
  <DatePicker datePickerType="range" bind:valueFrom bind:valueTo on:change>
    <DatePickerInput labelText="Report period start" placeholder="mm/dd/yyyy" />
    <DatePickerInput labelText="Report period end" placeholder="mm/dd/yyyy" />
  </DatePicker>
  <Stack gap={3} orientation="horizontal">
    <Button kind="tertiary" size="sm" on:click={() => selectLastDays(7)}>
      Last 7 days
    </Button>
    <Button kind="tertiary" size="sm" on:click={() => selectLastDays(30)}>
      Last 30 days
    </Button>
    <Button kind="tertiary" size="sm" on:click={selectThisMonth}>
      This month
    </Button>
  </Stack>
</Stack>
