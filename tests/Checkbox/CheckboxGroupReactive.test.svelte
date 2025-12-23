<script lang="ts">
  import { Checkbox } from "carbon-components-svelte";

  export let group = ["option-2"];

  export function setGroup(newGroup: string[]) {
    group = newGroup;
  }
</script>

<Checkbox
  bind:group
  value="option-1"
  labelText="Option 1"
  data-testid="checkbox-1"
/>

<Checkbox
  bind:group
  value="option-2"
  labelText="Option 2"
  data-testid="checkbox-2"
/>

<Checkbox
  bind:group
  value="option-3"
  labelText="Option 3"
  data-testid="checkbox-3"
/>

<div data-testid="group-value">{JSON.stringify(group)}</div>

