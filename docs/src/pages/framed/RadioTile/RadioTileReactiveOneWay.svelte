<script>
  import { RadioTile, TileGroup } from "carbon-components-svelte";

  const values = ["Lite plan", "Standard plan", "Plus plan"];

  let selected = values[1];
</script>

<TileGroup
  legend="Service pricing tiers"
  name="plan"
  on:select={({ detail }) => (selected = detail)}
>
  {#each values as value}
    <RadioTile {value} checked={selected === value}>
      {value}
    </RadioTile>
  {/each}
</TileGroup>

<br />

Selected: <strong>{selected}</strong>
