<svelte:options accessors />

<script lang="ts">
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
  import SelectableTileGroup from "carbon-components-svelte/Tile/SelectableTileGroup.svelte";

  export let outer: string[] = [];
  export let inner: string[] = [];
</script>

<SelectableTileGroup bind:selected={outer} legendText="Outer">
  <SelectableTile value="outer-1">Outer 1</SelectableTile>
  <SelectableTileGroup bind:selected={inner} legendText="Inner">
    <SelectableTile value="inner-1">Inner 1</SelectableTile>
  </SelectableTileGroup>
  <SelectableTile value="outer-2">Outer 2</SelectableTile>
</SelectableTileGroup>
