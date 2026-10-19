<script>
  import {
    Button,
    DatePicker,
    DatePickerInput,
    Stack,
  } from "carbon-components-svelte";

  let selectedDates = [];

  function selectManyDates(count) {
    const now = new Date();
    const dates = Array.from({ length: count }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() + i * 2);
      return date;
    });
    selectedDates = dates;
  }

  function clearAll() {
    selectedDates = [];
  }
</script>

<Stack gap={4}>
  <DatePicker datePickerType="multiple" bind:selectedDates>
    <DatePickerInput
      labelText="Stress test dates"
      placeholder="mm/dd/yyyy"
      helperText={`${selectedDates.length} date${selectedDates.length === 1 ? "" : "s"} selected`}
    />
  </DatePicker>
  <Stack gap={3} orientation="horizontal">
    <Button kind="tertiary" size="small" on:click={() => selectManyDates(20)}>
      Select 20 dates
    </Button>
    <Button kind="tertiary" size="small" on:click={() => selectManyDates(100)}>
      Select 100 dates
    </Button>
    <Button kind="tertiary" size="small" on:click={clearAll}>Clear all</Button>
  </Stack>
</Stack>
