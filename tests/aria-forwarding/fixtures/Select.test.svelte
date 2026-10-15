<script lang="ts">
  import Select from "carbon-components-svelte/Select/Select.svelte";
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
</script>

<Select labelText="Region" helperText="Pick one" {...$$restProps}>
  <SelectItem value="us" text="US" />
  <SelectItem value="eu" text="EU" />
</Select>
