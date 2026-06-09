<svelte:options accessors />

<script lang="ts">
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
  import SelectableTileGroup from "carbon-components-svelte/Tile/SelectableTileGroup.svelte";

  export let groupSelected: string[] = [];
  export let tileValue = "a";
  export let tileSelected = true;
</script>

<SelectableTileGroup bind:selected={groupSelected}>
  <SelectableTile value={tileValue} selected={tileSelected}>
    Dynamic
  </SelectableTile>
</SelectableTileGroup>
