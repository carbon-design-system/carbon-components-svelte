<script>
  import {
    Button,
    DatePicker,
    DatePickerInput,
    Stack,
  } from "carbon-components-svelte";

  let selectedDates = [];
  let todayButton = null;
</script>

<Stack gap={4}>
  <Button
    kind="tertiary"
    bind:ref={todayButton}
    on:click={() => (selectedDates = [new Date()])}
  >
    Jump to today
  </Button>
  <DatePicker
    datePickerType="single"
    bind:selectedDates
    closeOnSelect={false}
    keepOpenFor={todayButton ? [todayButton] : []}
    on:change
  >
    <DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" />
  </DatePicker>
</Stack>
