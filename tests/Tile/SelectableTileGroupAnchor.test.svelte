<script lang="ts">
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
  import SelectableTileGroup from "carbon-components-svelte/Tile/SelectableTileGroup.svelte";

  export let showFirst = true;
</script>

<SelectableTileGroup legendText="Regions">
  {#if showFirst}
    <SelectableTile value="a">A</SelectableTile>
  {/if}
  <SelectableTile value="b">B</SelectableTile>
  <SelectableTile value="c">C</SelectableTile>
  <SelectableTile value="d">D</SelectableTile>
</SelectableTileGroup>
