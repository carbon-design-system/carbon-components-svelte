<svelte:options accessors />

<script lang="ts">
  import {
    SelectableTile,
    SelectableTileGroup,
  } from "carbon-components-svelte";

  export let groupSelected: string[] = [];
  export let tileValue = "a";
  export let tileSelected = true;
</script>

<SelectableTileGroup bind:selected={groupSelected}>
  <SelectableTile value={tileValue} selected={tileSelected}>
    Dynamic
  </SelectableTile>
</SelectableTileGroup>
