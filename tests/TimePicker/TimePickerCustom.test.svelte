<script lang="ts">
  import {
    SelectItem,
    TimePicker,
    TimePickerSelect,
  } from "carbon-components-svelte";

  export let selectReadonly = false;
</script>

<TimePicker labelText="Custom label">
  <span slot="labelChildren">Custom Label Text</span>
  <TimePickerSelect value="pm" readonly={selectReadonly}>
    <SelectItem value="am" text="AM" />
    <SelectItem value="pm" text="PM" />
  </TimePickerSelect>
  <TimePickerSelect value="pdt" readonly={selectReadonly}>
    <SelectItem value="pdt" text="PDT" />
    <SelectItem value="gmt" text="GMT" />
  </TimePickerSelect>
</TimePicker>
