<script lang="ts">
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";

  export let selected = false;
  export let disabled = false;
  export let title = "Test Tile";
  export let value = "test-value";
  export let name = "test-name";
  export let iconDescription = "Test checkmark";
  export let onSelect: (detail: string) => void = () => {};
  export let onDeselect: (detail: string) => void = () => {};
</script>

<SelectableTile
  data-testid="selectable-tile"
  {selected}
  {disabled}
  {title}
  {value}
  {name}
  {iconDescription}
  on:select={(e) => onSelect(e.detail)}
  on:deselect={(e) => onDeselect(e.detail)}
>
  Test Tile Content
</SelectableTile>
