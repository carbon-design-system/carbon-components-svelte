<script lang="ts">
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import TimePicker from "carbon-components-svelte/TimePicker/TimePicker.svelte";
  import TimePickerSelect from "carbon-components-svelte/TimePicker/TimePickerSelect.svelte";

  export let fluid = false;
  export let selectProps: Record<string, unknown> = {};
</script>

<TimePicker {fluid} labelText="Time">
  <TimePickerSelect labelText="Period" value="am" {...selectProps}>
    <SelectItem value="am" text="AM" />
    <SelectItem value="pm" text="PM" />
  </TimePickerSelect>
</TimePicker>
