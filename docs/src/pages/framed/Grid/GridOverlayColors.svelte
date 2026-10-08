<script>
  import {
    Column,
    Grid,
    GridOverlay,
    Row,
    Tile,
  } from "carbon-components-svelte";
</script>

<div style="background: #0f62fe; min-height: 100vh;">
  <Grid padding>
    <Row>
      <Column sm={4} md={4} lg={8}>
        <Tile light>The default blue would vanish on this background.</Tile>
      </Column>
    </Row>
  </Grid>
</div>

<GridOverlay
  open
  baseline={8}
  color="var(--cds-text-on-color)"
  baselineColor="var(--cds-support-03)"
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
