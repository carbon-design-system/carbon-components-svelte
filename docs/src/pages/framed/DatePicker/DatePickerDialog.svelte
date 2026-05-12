<script>
  import {
    Button,
    DatePicker,
    DatePickerInput,
  } from "carbon-components-svelte";

  let dialog = null;
</script>

<Button on:click={() => dialog?.showModal()}>Open dialog</Button>

<dialog bind:this={dialog}>
  <p>
    With <code>portalMenu</code>, the calendar auto-mounts into the nearest
    <code>&lt;dialog&gt;</code>
    ancestor so it renders above the modal backdrop.
  </p>
  <DatePicker portalMenu datePickerType="single">
    <DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" />
  </DatePicker>
  <Button kind="secondary" on:click={() => dialog?.close()}>Close</Button>
</dialog>
