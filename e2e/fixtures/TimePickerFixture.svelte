<script>
  import {
    SelectItem,
    TimePicker,
    TimePickerSelect,
  } from "carbon-components-svelte";

  let value = "";
</script>

<TimePicker data-testid="time-picker" labelText="Meeting time" bind:value>
  <TimePickerSelect value="pm" labelText="AM/PM">
    <SelectItem value="am" text="AM" />
    <SelectItem value="pm" text="PM" />
  </TimePickerSelect>
</TimePicker>
