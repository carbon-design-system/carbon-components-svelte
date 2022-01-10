<script>
  import { TileGroup, RadioTile } from "carbon-components-svelte";

  const values = ["Lite plan", "Standard plan", "Plus plan"];

  let selected = values[0];
</script>

<TileGroup
  legend="Service pricing tiers"
  on:select="{({ detail }) => (selected = detail)}"
>
  {#each values as value}
    <RadioTile value="{value}" checked="{selected === value}">{value}</RadioTile
    >
  {/each}
</TileGroup>

<br />

Selected: <strong>{selected}</strong>
