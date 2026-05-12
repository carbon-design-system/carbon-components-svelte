<script>
  import {
    Button,
    DatePicker,
    DatePickerInput,
  } from "carbon-components-svelte";

  let dialog = null;
  let popover = null;
</script>

<button
  type="button"
  data-testid="open-dialog"
  on:click={() => dialog?.showModal()}
>
  Open dialog
</button>

<dialog data-testid="native-dialog" bind:this={dialog}>
  <Button kind="secondary" on:click={() => dialog?.close()}>Close</Button>
  <DatePicker portalMenu datePickerType="single">
    <DatePickerInput
      data-testid="dialog-date-picker-portal-input"
      labelText="Dialog date (portalMenu)"
      placeholder="mm/dd/yyyy"
    />
  </DatePicker>
</dialog>

<button
  type="button"
  data-testid="open-popover"
  on:click={() => popover?.showPopover()}
>
  Open popover
</button>

<div
  data-testid="native-popover"
  popover="manual"
  bind:this={popover}
  style="width: 600px; padding: 1rem;"
>
  <button type="button" on:click={() => popover?.hidePopover()}>Close</button>
  <DatePicker portalMenu datePickerType="single">
    <DatePickerInput
      data-testid="popover-date-picker-portal-input"
      labelText="Popover date (portalMenu)"
      placeholder="mm/dd/yyyy"
    />
  </DatePicker>
</div>
