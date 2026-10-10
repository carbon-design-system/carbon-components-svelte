<script>
  import {
    Column,
    Grid,
    GridOverlay,
    Row,
    Tile,
  } from "carbon-components-svelte";
</script>

<Grid padding>
  <Row style="margin-top: 1.5rem;">
    <Column sm={4} md={5} lg={11}><Tile>lg=11: columns 1 to 11</Tile></Column>
    <Column sm={4} md={3} lg={5}><Tile>lg=5: columns 12 to 16</Tile></Column>
  </Row>
  <Row>
    <Column
      sm={{ span: 2, offset: 2 }}
      md={{ span: 4, offset: 4 }}
      lg={{ span: 6, offset: 5 }}
    >
      <Tile>lg offset 5: starts at column 6</Tile>
    </Column>
  </Row>
</Grid>

<GridOverlay open numbers />

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
