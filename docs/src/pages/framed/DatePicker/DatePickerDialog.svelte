<script>
  import {
    Button,
    DatePicker,
    DatePickerInput,
    Dialog,
    Stack,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open dialog</Button>

<Dialog bind:open modal aria-label="Meeting scheduler">
  <Stack gap={5}>
    <p>
      With <code>portalMenu</code>, the calendar auto-mounts into the nearest
      <code>&lt;dialog&gt;</code>
      ancestor so it renders above the modal backdrop.
    </p>
    <DatePicker portalMenu datePickerType="single">
      <DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" />
    </DatePicker>
    <Button kind="secondary" on:click={() => (open = false)}>Close</Button>
  </Stack>
</Dialog>
