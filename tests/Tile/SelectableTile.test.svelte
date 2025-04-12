<script lang="ts">
  import { SelectableTile } from "carbon-components-svelte";

  export let selected = false;
  export let light = false;
  export let disabled = false;
  export let title = "Test Tile";
  export let value = "test-value";
  export let name = "test-name";
  export let iconDescription = "Test checkmark";
</script>

<SelectableTile
  data-testid="selectable-tile"
  {selected}
  {light}
  {disabled}
  {title}
  {value}
  {name}
  {iconDescription}
  on:select={(e) => {
    console.log("select", e.detail);
  }}
  on:deselect={(e) => {
    console.log("deselect", e.detail);
  }}
>
  Test Tile Content
</SelectableTile>
