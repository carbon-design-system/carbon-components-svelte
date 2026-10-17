<script lang="ts">
  import Select from "carbon-components-svelte/Select/Select.svelte";
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";

  export let open = false;
  export let onUpdate: (detail: unknown) => void = () => {};
</script>

<button type="button" on:click={() => (open = !open)}>toggle</button>
{#if open}
  <Select labelText="Toggled select" on:update={(e) => onUpdate(e.detail)}>
    <SelectItem value="test" text="test" />
  </Select>
{/if}
