<script>
  import {
    Button,
    DatePicker,
    DatePickerInput,
    Stack,
  } from "carbon-components-svelte";

  let calendar = null;
  let selectedCount = 0;

  function selectManyDates(count) {
    const now = new Date();
    const dates = Array.from({ length: count }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() + i * 2);
      return date;
    });
    calendar?.setDate(dates, true);
  }

  function clearAll() {
    calendar?.clear(true);
  }

  function handleChange(event) {
    selectedCount = event.detail.selectedDates.length;
  }
</script>

<Stack gap={4}>
  <DatePicker datePickerType="multiple" bind:calendar on:change={handleChange}>
    <DatePickerInput
      labelText="Stress test dates"
      placeholder="mm/dd/yyyy"
      helperText={`${selectedCount} date${selectedCount === 1 ? "" : "s"} selected`}
    />
  </DatePicker>
  <Stack gap={3} orientation="horizontal">
    <Button kind="tertiary" size="sm" on:click={() => selectManyDates(20)}>
      Select 20 dates
    </Button>
    <Button kind="tertiary" size="sm" on:click={() => selectManyDates(100)}>
      Select 100 dates
    </Button>
    <Button kind="tertiary" size="sm" on:click={clearAll}>Clear all</Button>
  </Stack>
</Stack>
