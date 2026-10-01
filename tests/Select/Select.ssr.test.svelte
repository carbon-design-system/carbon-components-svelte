<script lang="ts">
  import Select from "carbon-components-svelte/Select/Select.svelte";
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";

  export let selected: string | undefined = undefined;
</script>

<Select labelText="Size" {selected}>
  <SelectItem value="sm" text="Small" />
  <SelectItem value="md" text="Medium" />
  <SelectItem value="lg" text="Large" />
</Select>
