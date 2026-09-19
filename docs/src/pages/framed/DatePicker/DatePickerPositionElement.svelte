<script>
  import { Box, DatePicker, DatePickerInput } from "carbon-components-svelte";

  let anchor = null;
</script>

<Box bind:ref={anchor} border="strong" padding={5} width="28rem">
  <DatePicker
    datePickerType="single"
    portalMenu
    flatpickrProps={{ positionElement: anchor, position: "auto right" }}
    on:change
  >
    <DatePickerInput
      labelText="Meeting date"
      helperText="The calendar aligns to the bordered container, not the input."
      placeholder="mm/dd/yyyy"
    />
  </DatePicker>
</Box>
