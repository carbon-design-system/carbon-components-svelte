<script>
  import { Button, Checkbox } from "carbon-components-svelte";

  let values = ["Apple", "Banana", "Coconut"];
  let group = values.slice(0, 2);
</script>

{#each values as value}
  <Checkbox bind:group labelText={value} {value} />
{/each}

<div style="margin: var(--cds-layout-01) 0">
  <Button on:click={() => (group = ["Banana"])}>Set to ["Banana"]</Button>
</div>

<strong>Selected:</strong>
{JSON.stringify(group)}
