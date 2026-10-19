<svelte:options accessors />

<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";

  export let group = ["option-2"];
  export let onCheck: ((value: string, checked: boolean) => void) | undefined =
    undefined;
</script>

<Checkbox
  bind:group
  value="option-1"
  labelText="Option 1"
  data-testid="checkbox-1"
  on:check={(e) => onCheck?.("option-1", e.detail)}
/>

<Checkbox
  bind:group
  value="option-2"
  labelText="Option 2"
  data-testid="checkbox-2"
  on:check={(e) => onCheck?.("option-2", e.detail)}
/>

<Checkbox
  bind:group
  value="option-3"
  labelText="Option 3"
  data-testid="checkbox-3"
  on:check={(e) => onCheck?.("option-3", e.detail)}
/>

<div data-testid="group-value">{JSON.stringify(group)}</div>
