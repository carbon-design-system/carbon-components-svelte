<script>
  import {
    Box,
    Column,
    Grid,
    Layer,
    Row,
    Tile,
  } from "carbon-components-svelte";
  import { GridOverlay } from "carbon-components-svelte/devtools";
</script>

<Box fill="brand" minHeight="viewport">
  <Grid padding>
    <Row>
      <Column sm={4} md={4} lg={8}>
        <Layer>
          <Tile>The default blue would vanish on this background.</Tile>
        </Layer>
      </Column>
    </Row>
  </Grid>
</Box>

<GridOverlay open baseline={8} class="custom-overlay" />

<style>
  /* Any CSS color works, including other Carbon tokens. */
  :global(.custom-overlay) {
    --ccs-grid-overlay-fill: var(--cds-text-on-color);
    --ccs-grid-overlay-ink: var(--cds-text-on-color);
    --ccs-grid-overlay-row: var(--cds-support-warning);
    --ccs-grid-overlay-row-strong: var(--cds-support-warning);
  }
</style>

<!-- docs-only:start -->
<svelte:head>
  <style>
    /* The overlay is fixed to the viewport, so drop the frame's side padding
       to line the Grid up with it, and hide the frame's column guides. */
    body.framed {
      padding-inline: 0;
    }

    body.framed :not(.bx--content) [class^="bx--col"] {
      box-shadow: none;
    }
  </style>
</svelte:head>
<!-- docs-only:end -->
