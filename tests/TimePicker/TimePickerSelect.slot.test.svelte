<script lang="ts">
  import { SelectItem, TimePickerSelect } from "carbon-components-svelte";
</script>

<TimePickerSelect labelText="Default label">
  <span slot="labelText">Custom label content</span>
  <SelectItem value="option1" text="Option 1" />
  <SelectItem value="option2" text="Option 2" />
</TimePickerSelect>
