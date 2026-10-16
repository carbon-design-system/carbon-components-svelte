<script lang="ts">
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import TimePicker from "carbon-components-svelte/TimePicker/TimePicker.svelte";
  import TimePickerSelect from "carbon-components-svelte/TimePicker/TimePickerSelect.svelte";

  export let fluid = false;
  export let hideLabel = false;
</script>

<TimePicker labelText="Starts at" {fluid} {hideLabel}>
  <TimePickerSelect labelText="AM or PM" value="am">
    <SelectItem value="am" text="AM" />
    <SelectItem value="pm" text="PM" />
  </TimePickerSelect>
  <TimePickerSelect labelText="Time zone" value="utc">
    <SelectItem value="utc" text="UTC" />
  </TimePickerSelect>
</TimePicker>
