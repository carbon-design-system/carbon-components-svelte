<script lang="ts">
  import { Select, SelectItem } from "carbon-components-svelte";
</script>

<Select labelText="Falsy text">
  <SelectItem value={-1} text="" />
  <SelectItem value={0} text="Zero" />
  <SelectItem value={1} text="One" />
</Select>

<Select labelText="Undefined text">
  <SelectItem value={2} />
  <SelectItem value={0} text="Zero" />
  <SelectItem value={1} text="One" />
</Select>
