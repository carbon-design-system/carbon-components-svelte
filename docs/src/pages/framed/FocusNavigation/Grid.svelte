<script>
  import {
    Box,
    createFocusNav,
    focusNav,
    Stack,
  } from "carbon-components-svelte";

  const COLUMNS = 6;
  const swatches = [
    "Red",
    "Orange",
    "Yellow",
    "Green",
    "Teal",
    "Cyan",
    "Blue",
    "Purple",
    "Magenta",
    "Gray",
    "Black",
    "White",
    "Cool gray",
    "Warm gray",
    "Brown",
    "Pink",
    "Lime",
    "Indigo",
    "Navy",
  ];

  let chosen = "none";

  // Left and Right carry on into the next line, as in a text flow. Up and
  // Down keep the column, so the short last line clamps and the column comes
  // back on the way up.
  const nav = createFocusNav({
    selector: "[role='gridcell']",
    orientation: "grid",
    columns: COLUMNS,
    flow: true,
    pageSize: 2,
  });
</script>

<Stack gap={3}>
  <Box width="24rem">
    <div role="grid" aria-label="Swatches" use:focusNav={nav}>
      {#each Array.from({ length: Math.ceil(swatches.length / COLUMNS) }, (_, row) => row) as row (row)}
        <div role="row" class="row">
          {#each swatches.slice(row * COLUMNS, row * COLUMNS + COLUMNS) as swatch, column (swatch)}
            <div
              role="gridcell"
              class="cell"
              tabindex={row * COLUMNS + column === $nav.tabStop ? 0 : -1}
              on:click={() => (chosen = swatch)}
              on:keydown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  chosen = swatch;
                }
              }}
            >
              {swatch}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </Box>
  <p>Chosen: {chosen}</p>
</Stack>

<style>
  .row {
    display: flex;
    gap: 1px;
    margin-block-end: 1px;
  }

  .cell {
    flex: 1;
    min-inline-size: 0;
    padding: 0.5rem 0.25rem;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
    background: var(--cds-layer-02);
    color: var(--cds-text-primary);
    cursor: pointer;
  }

  .cell:focus-visible {
    outline: 2px solid var(--cds-focus);
    outline-offset: -2px;
  }
</style>
