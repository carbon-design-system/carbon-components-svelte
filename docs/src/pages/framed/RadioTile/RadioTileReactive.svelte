<script>
  import { Button, RadioTile, Stack, TileGroup } from "carbon-components-svelte";

  const values = ["Lite plan", "Standard plan", "Plus plan"];

  let selected = values[1];
</script>

<Stack gap={5}>
  <TileGroup legendText="Service pricing tiers" name="plan" bind:selected>
    {#each values as value}
      <RadioTile {value}>{value}</RadioTile>
    {/each}
  </TileGroup>
  <div>
    Selected: <strong>{selected}</strong>
  </div>
  <Button
    size="small"
    disabled={selected === values[1]}
    on:click={() => (selected = values[1])}
  >
    Set to "{values[1]}"
  </Button>
</Stack>
