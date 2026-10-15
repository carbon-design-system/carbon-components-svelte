<script lang="ts">
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import TimePickerSelect from "carbon-components-svelte/TimePicker/TimePickerSelect.svelte";
</script>

<TimePickerSelect labelText="Period" value="am" readonly {...$$restProps}>
  <SelectItem value="am" text="AM" />
  <SelectItem value="pm" text="PM" />
</TimePickerSelect>
