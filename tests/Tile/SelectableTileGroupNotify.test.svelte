<svelte:options accessors />

<script lang="ts">
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
  import SelectableTileGroup from "carbon-components-svelte/Tile/SelectableTileGroup.svelte";
  import SelectableTileGroupStoreSpy from "./SelectableTileGroupStoreSpy.test.svelte";

  export let selected: string[] = [];
  export let onNotify: () => void;
</script>

<SelectableTileGroup bind:selected>
  <SelectableTileGroupStoreSpy {onNotify} />
  <SelectableTile value="a">A</SelectableTile>
  <SelectableTile value="b">B</SelectableTile>
</SelectableTileGroup>
