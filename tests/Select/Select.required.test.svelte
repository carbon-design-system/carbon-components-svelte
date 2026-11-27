<script lang="ts">
  import Select from "carbon-components-svelte/Select/Select.svelte";
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
</script>

<form data-testid="form">
  <Select required labelText="Size">
    <SelectItem value="" text="Choose a size" />
    <SelectItem value="s" text="Small" />
    <SelectItem value="m" text="Medium" />
  </Select>
</form>
