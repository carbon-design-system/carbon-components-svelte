<script>
  import {
    Button,
    DatePicker,
    DatePickerInput,
    Stack,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Stack gap={5}>
  <div>
    <Button kind="tertiary" size="small" on:click={() => (open = true)}>
      Open calendar
    </Button>
  </div>
  <DatePicker datePickerType="single" bind:open>
    <DatePickerInput
      labelText="Follow-up date (open: {open})"
      placeholder="mm/dd/yyyy"
    />
  </DatePicker>
</Stack>
