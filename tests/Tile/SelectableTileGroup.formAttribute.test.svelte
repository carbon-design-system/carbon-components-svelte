<script lang="ts">
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
  import SelectableTileGroup from "carbon-components-svelte/Tile/SelectableTileGroup.svelte";
</script>

<form id="outer-form" data-testid="form"></form>
<SelectableTileGroup
  form="outer-form"
  name="tiles"
  selected={["a"]}
  legendText="Tiles"
>
  <SelectableTile value="a">A</SelectableTile>
  <SelectableTile value="b">B</SelectableTile>
</SelectableTileGroup>
