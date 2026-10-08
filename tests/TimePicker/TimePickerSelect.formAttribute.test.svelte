<script lang="ts">
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import TimePickerSelect from "carbon-components-svelte/TimePicker/TimePickerSelect.svelte";
</script>

<form id="outer-form" data-testid="form"></form>
<TimePickerSelect form="outer-form" name="period" value="pm" labelText="Period">
  <SelectItem value="am" text="AM" />
  <SelectItem value="pm" text="PM" />
</TimePickerSelect>
