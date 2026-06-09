<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
  import TileGroup from "carbon-components-svelte/Tile/TileGroup.svelte";

  const values = ["Lite plan", "Standard plan", "Plus plan"];

  let selected = values[1];
</script>

<TileGroup legendText="Service pricing tiers" name="plan" bind:selected>
  {#each values as value}
    <RadioTile {value}>{value}</RadioTile>
  {/each}
</TileGroup>

<div>Selected: {selected}</div>

<Button
  size="small"
  disabled={selected === values[1]}
  on:click={() => (selected = values[1])}
>
  Set to "{values[1]}"
</Button>
