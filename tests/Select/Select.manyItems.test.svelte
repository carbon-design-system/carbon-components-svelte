<script lang="ts">
  import Select from "carbon-components-svelte/Select/Select.svelte";
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";

  export let selected: number | undefined = undefined;
  export let count = 40;
  export let onUpdate: (detail: unknown) => void = () => {};

  $: values = Array.from({ length: count }, (_, index) => index);
</script>

<Select
  bind:selected
  id="many-numeric-items"
  labelText="Select label"
  on:update={(e) => onUpdate(e.detail)}
>
  {#each values as value (value)}
    <SelectItem {value} text={`Option ${value}`} />
  {/each}
</Select>
