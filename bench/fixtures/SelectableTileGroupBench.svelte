<svelte:options accessors />

<script lang="ts">
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
  import SelectableTileGroup from "carbon-components-svelte/Tile/SelectableTileGroup.svelte";

  export let count = 100;
  export let selected: string[] = [];
</script>

<SelectableTileGroup bind:selected legendText="Tiles">
  {#each { length: count } as _, i}
    <SelectableTile value={`tile-${i}`}>{`Tile ${i}`}</SelectableTile>
  {/each}
</SelectableTileGroup>
