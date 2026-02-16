<script>
  import { Button, Checkbox, Stack } from "carbon-components-svelte";

  let values = ["Apple", "Banana", "Coconut"];
  let group = values.slice(0, 2);
</script>

<Stack inline gap={4}>
  <div>
    {#each values as value}
      <Checkbox bind:group labelText={value} {value} />
    {/each}
  </div>

  <Button on:click={() => (group = ["Banana"])}>Set to ["Banana"]</Button>

  <div>
    <strong>Selected:</strong>
    {JSON.stringify(group)}
  </div>
</Stack>
