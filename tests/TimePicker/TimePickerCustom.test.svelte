<script lang="ts">
  import {
    TimePicker,
    TimePickerSelect,
    SelectItem,
  } from "carbon-components-svelte";
</script>

<TimePicker labelText="Custom label">
  <span slot="labelText">Custom Label Text</span>
  <TimePickerSelect value="pm">
    <SelectItem value="am" text="AM" />
    <SelectItem value="pm" text="PM" />
  </TimePickerSelect>
  <TimePickerSelect value="pdt">
    <SelectItem value="pdt" text="PDT" />
    <SelectItem value="gmt" text="GMT" />
  </TimePickerSelect>
</TimePicker>
