<script>
  import {
    SelectableTile,
    SelectableTileGroup,
  } from "carbon-components-svelte";

  let selected = [];
</script>

<SelectableTileGroup
  data-testid="selectable-tile-group"
  legendText="Choose one or more"
  bind:selected
>
  <SelectableTile value="x" data-testid="selectable-tile-x"
    >Option X</SelectableTile
  >
  <SelectableTile value="y" data-testid="selectable-tile-y"
    >Option Y</SelectableTile
  >
</SelectableTileGroup>
<div data-testid="selected-values">{selected.join(",") || "none"}</div>
