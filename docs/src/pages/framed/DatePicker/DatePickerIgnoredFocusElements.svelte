<script>
  import {
    Button,
    DatePicker,
    DatePickerInput,
    Stack,
  } from "carbon-components-svelte";

  let calendar = null;
  let todayButton = null;
</script>

<Stack gap={4}>
  <DatePicker
    datePickerType="single"
    bind:calendar
    flatpickrProps={{
      closeOnSelect: false,
      ignoredFocusElements: todayButton ? [todayButton] : [],
    }}
    on:change
  >
    <DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" />
  </DatePicker>
  <Button
    kind="tertiary"
    bind:ref={todayButton}
    on:click={() => calendar?.setDate(new Date(), true)}
  >
    Jump to today
  </Button>
</Stack>
