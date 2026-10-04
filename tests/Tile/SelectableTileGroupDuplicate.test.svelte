<svelte:options accessors />

<script lang="ts">
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
  import SelectableTileGroup from "carbon-components-svelte/Tile/SelectableTileGroup.svelte";

  export let values = ["a", "b"];
</script>

<SelectableTileGroup>
  {#each values as value}
    <SelectableTile {value}>{value}</SelectableTile>
  {/each}
</SelectableTileGroup>
