<script>
  import {
    Box,
    Column,
    Grid,
    GridOverlay,
    Layer,
    Row,
    Tile,
  } from "carbon-components-svelte";
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

<GridOverlay
  open
  baseline={8}
  color="var(--cds-text-on-color)"
  baselineColor="var(--cds-support-warning)"
/>

<!-- docs-only:start -->
<style>
  /* The overlay is fixed to the viewport, so drop the frame's side padding
     to line the Grid up with it, and hide the frame's column guides. */
  :global(body.framed) {
    padding-inline: 0;
  }

  :global(body.framed :not(.bx--content) [class^="bx--col"]) {
    box-shadow: none;
  }
</style>
<!-- docs-only:end -->
