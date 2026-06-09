<script lang="ts">
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import TimePickerSelect from "carbon-components-svelte/TimePicker/TimePickerSelect.svelte";
</script>

<TimePickerSelect labelText="Default label">
  <span slot="labelChildren">Custom label content</span>
  <SelectItem value="option1" text="Option 1" />
  <SelectItem value="option2" text="Option 2" />
</TimePickerSelect>
