<script>
  import {
    Button,
    DatePicker,
    DatePickerInput,
    Stack,
  } from "carbon-components-svelte";

  let selectedDates = [];

  function nextWeek() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    selectedDates = [start, end];
  }
</script>

<Stack gap={4}>
  <DatePicker datePickerType="range" bind:selectedDates>
    <DatePickerInput labelText="Sprint start" placeholder="mm/dd/yyyy" />
    <DatePickerInput labelText="Sprint end" placeholder="mm/dd/yyyy" />
  </DatePicker>
  <div>
    <Button kind="tertiary" size="small" on:click={nextWeek}>Next week</Button>
  </div>
  <p>
    selectedDates:
    {selectedDates.length
      ? selectedDates.map((date) => date.toDateString()).join(" to ")
      : "none"}
  </p>
</Stack>
