<script lang="ts">
  import Select from "carbon-components-svelte/Select/Select.svelte";
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";

  export let selected: string | number | undefined = undefined;
  export let numeric = false;
  export let inline = false;
  export let onUpdate: (event: CustomEvent) => void = () => {};
</script>

<form data-testid="form">
  <Select
    bind:selected
    {inline}
    name="size"
    labelText="Size"
    on:update={onUpdate}
  >
    {#if numeric}
      <SelectItem value={0} text="Zero" />
      <SelectItem value={1} text="One" />
      <SelectItem value={2} text="Two" />
    {:else}
      <SelectItem value="s" text="Small" />
      <SelectItem value="m" text="Medium" />
      <SelectItem value="l" text="Large" />
    {/if}
  </Select>
</form>
<p data-testid="bound">{String(selected)}</p>
