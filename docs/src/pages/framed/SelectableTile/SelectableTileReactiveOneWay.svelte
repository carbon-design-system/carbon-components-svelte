<script>
  import {
    SelectableTile,
    SelectableTileGroup,
  } from "carbon-components-svelte";

  const values = ["Lite plan", "Standard plan", "Plus plan"];

  let selected = [values[0], values[1]];
</script>

<SelectableTileGroup
  legendText="Service pricing tiers"
  name="plan"
  on:select={({ detail }) => (selected = [...selected, detail])}
  on:deselect={({ detail }) => (selected = selected.filter((v) => v !== detail))}
>
  {#each values as value}
    <SelectableTile {value} selected={selected.includes(value)}>
      {value}
    </SelectableTile>
  {/each}
</SelectableTileGroup>

<br />

Selected: <strong>{selected.join(", ") || "None"}</strong>
