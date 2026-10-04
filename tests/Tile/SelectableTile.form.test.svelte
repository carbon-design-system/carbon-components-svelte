<script lang="ts">
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
  import SelectableTileGroup from "carbon-components-svelte/Tile/SelectableTileGroup.svelte";

  export let selected: string[] = [];
  export let standaloneSelected = false;
  export let onEvent: (event: CustomEvent) => void = () => {};
</script>

<form data-testid="form">
  <SelectableTileGroup
    bind:selected
    name="regions"
    legendText="Regions"
    on:select={onEvent}
    on:deselect={onEvent}
  >
    <SelectableTile value="a" data-testid="tile-a">A</SelectableTile>
    <SelectableTile value="b" data-testid="tile-b">B</SelectableTile>
  </SelectableTileGroup>
  <SelectableTile
    bind:selected={standaloneSelected}
    value="solo"
    name="solo"
    data-testid="tile-solo"
    on:select={onEvent}
    on:deselect={onEvent}
  >
    Solo
  </SelectableTile>
</form>
<p data-testid="bound">{selected.join(",")}</p>
<p data-testid="bound-standalone">{String(standaloneSelected)}</p>
