<svelte:options accessors />

<script lang="ts">
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
  import SelectableTileGroup from "carbon-components-svelte/Tile/SelectableTileGroup.svelte";

  export let selected: string[] = [];
</script>

<SelectableTileGroup bind:selected name="options">
  <SelectableTile value="option1">Option 1</SelectableTile>
  <SelectableTile value="option2">Option 2</SelectableTile>
  <SelectableTile disabled value="option3">Option 3</SelectableTile>
  <SelectableTile value="option4">Option 4</SelectableTile>
</SelectableTileGroup>
