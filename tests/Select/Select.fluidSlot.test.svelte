<script lang="ts">
  import Select from "carbon-components-svelte/Select/Select.svelte";
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";

  export let fluid = true;
</script>

<Select {fluid} labelText="Default label">
  <svelte:fragment slot="labelChildren">Custom label content</svelte:fragment>
  <SelectItem value="option-1" text="Option 1" />
  <SelectItem value="option-2" text="Option 2" />
</Select>
