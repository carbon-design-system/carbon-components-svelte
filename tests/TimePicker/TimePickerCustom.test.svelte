<script lang="ts">
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import TimePicker from "carbon-components-svelte/TimePicker/TimePicker.svelte";
  import TimePickerSelect from "carbon-components-svelte/TimePicker/TimePickerSelect.svelte";
  import type { ComponentProps } from "svelte";

  export let selectReadonly = false;
  export let id: ComponentProps<TimePickerSelect>["id"] = undefined;
  export let readonlyText: ComponentProps<TimePickerSelect>["readonlyText"] =
    undefined;
</script>

<TimePicker labelText="Custom label">
  <span slot="labelChildren">Custom Label Text</span>
  <TimePickerSelect value="pm" readonly={selectReadonly} {id} {readonlyText}>
    <SelectItem value="am" text="AM" />
    <SelectItem value="pm" text="PM" />
  </TimePickerSelect>
  <TimePickerSelect value="pdt" readonly={selectReadonly}>
    <SelectItem value="pdt" text="PDT" />
    <SelectItem value="gmt" text="GMT" />
  </TimePickerSelect>
</TimePicker>
