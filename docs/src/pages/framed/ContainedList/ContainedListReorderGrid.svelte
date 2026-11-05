<script>
  import {
    applySort,
    Box,
    sortable,
    Stack,
    Tile,
  } from "carbon-components-svelte";

  let tiles = [
    "Overview",
    "Latency",
    "Errors",
    "Saturation",
    "Traffic",
    "Cost",
    "Deploys",
    "Alerts",
    "Logs",
  ].map((title) => ({ id: title.toLowerCase(), title }));

  function handleSort(event) {
    tiles = applySort(tiles, event.detail);
  }
</script>

<div
  use:sortable={{
    orientation: "grid",
    label: "Dashboard tiles",
    itemSelector: ".bx--tile",
  }}
  on:sort={handleSort}
>
  <Box maxWidth="40rem">
    <Stack orientation="horizontal" wrap="wrap" gap={4}>
      {#each tiles as tile (tile.id)}
        <Box width="12rem">
          <Tile data-sortable-id={tile.id}>{tile.title}</Tile>
        </Box>
      {/each}
    </Stack>
  </Box>
</div>
