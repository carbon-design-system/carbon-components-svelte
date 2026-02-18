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
  <SelectableTileGroup legendText="Service pricing tiers" name="plan" bind:selected>
    {#each values as value}
      <SelectableTile {value}>{value}</SelectableTile>
    {/each}
  </SelectableTileGroup>
  <div>
    Selected: <strong>{selected.join(", ") || "None"}</strong>
  </div>
  <Button
    size="small"
    disabled={selected.length === 1 && selected[0] === values[1]}
    on:click={() => (selected = [values[1]])}
  >
    Set to "{values[1]}" only
  </Button>
</Stack>
