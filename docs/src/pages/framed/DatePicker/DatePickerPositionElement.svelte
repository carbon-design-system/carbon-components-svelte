<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  let anchor = null;
</script>

<div
  bind:this={anchor}
  style:width="28rem"
  style:padding="1rem"
  style:outline="1px dashed var(--cds-border-strong)"
>
  <DatePicker
    datePickerType="single"
    portalMenu
    flatpickrProps={{ positionElement: anchor, position: "auto right" }}
    on:change
  >
    <DatePickerInput
      labelText="Meeting date"
      helperText="The calendar aligns to the outlined container, not the input."
      placeholder="mm/dd/yyyy"
    />
  </DatePicker>
</div>
