<script>
  import {
    SelectItem,
    TimePicker,
    TimePickerSelect,
  } from "carbon-components-svelte";

  let value = "";
</script>

<div class="fixture-container">
  <TimePicker
    data-testid="time-picker"
    labelText="Meeting time"
    bind:value
  >
    <TimePickerSelect value="pm" labelText="AM/PM">
      <SelectItem value="am" text="AM" />
      <SelectItem value="pm" text="PM" />
    </TimePickerSelect>
  </TimePicker>
</div>

<style>
  .fixture-container {
    padding: 2rem;
  }
</style>
