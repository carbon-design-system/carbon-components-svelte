<script lang="ts">
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
  import TileGroup from "carbon-components-svelte/Tile/TileGroup.svelte";

  const values = ["monthly", "annual"];

  let checked = [true, false];
  let selected: string | undefined = undefined;
</script>

<TileGroup bind:selected legendText="Billing cycle">
  {#each values as value, i}
    <RadioTile {value} bind:checked={checked[i]}>{value}</RadioTile>
  {/each}
</TileGroup>
<button type="button" on:click={() => (checked[1] = true)}>Pick annual</button>
<p data-testid="bound">{JSON.stringify(checked)} {selected}</p>
