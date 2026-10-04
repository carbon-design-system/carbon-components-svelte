<script lang="ts">
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";

  const values = ["monthly", "annual"];

  let checked = [true, false];
</script>

{#each values as value, i}
  <RadioTile name="cycle" {value} bind:checked={checked[i]}>{value}</RadioTile>
{/each}
<button type="button" on:click={() => (checked[0] = true)}>Pick monthly</button>
<p data-testid="bound">{JSON.stringify(checked)}</p>
