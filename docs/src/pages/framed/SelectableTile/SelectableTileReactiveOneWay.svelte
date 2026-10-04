<script>
  import {
    Button,
    SelectableTile,
    SelectableTileGroup,
    Stack,
  } from "carbon-components-svelte";

  const values = ["Lite plan", "Standard plan", "Plus plan"];

  let selected = [values[0], values[1]];
</script>

<Stack gap={5}>
  <SelectableTileGroup
    legendText="Service pricing tiers"
    name="plan"
    {selected}
    on:change={({ detail }) => (selected = detail)}
  >
    {#each values as value}
      <SelectableTile {value}>{value}</SelectableTile>
    {/each}
  </SelectableTileGroup>
  <div>Selected: <strong>{selected.join(", ") || "None"}</strong></div>
  <Button
    size="small"
    kind="tertiary"
    disabled={selected.length === 0}
    on:click={() => (selected = [])}
  >
    Clear selection
  </Button>
</Stack>
