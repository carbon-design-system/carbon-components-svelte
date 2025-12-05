<script lang="ts">
  import { Select, SelectItem } from "carbon-components-svelte";
</script>

<Select labelText="Default label">
  <span slot="labelChildren">Custom label content</span>
  <SelectItem value="option1" text="Option 1" />
  <SelectItem value="option2" text="Option 2" />
</Select>
