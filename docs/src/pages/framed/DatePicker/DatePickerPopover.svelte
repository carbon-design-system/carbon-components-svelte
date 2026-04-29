<script>
  import {
    Button,
    DatePicker,
    DatePickerInput,
  } from "carbon-components-svelte";

  let popover = null;
</script>

<Button type="button" on:click={() => popover?.showPopover()}
  >Open popover</Button
>

<div
  bind:this={popover}
  popover="manual"
  style="width: min(100%, 28rem); padding: 1rem; border: 1px dashed var(--cds-border-subtle);"
>
  <p>
    With <code>portalMenu</code>, the calendar auto-mounts into the nearest
    <code>[popover]</code>
    ancestor so it renders in the popover top layer instead of behind it.
  </p>
  <DatePicker portalMenu datePickerType="single">
    <DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" />
  </DatePicker>
  <Button
    kind="secondary"
    type="button"
    on:click={() => popover?.hidePopover()}
  >
    Close
  </Button>
</div>
