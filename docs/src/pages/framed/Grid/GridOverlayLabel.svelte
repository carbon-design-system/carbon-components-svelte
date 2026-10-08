<script>
  import {
    Column,
    Grid,
    GridOverlay,
    Row,
    Text,
    Tile,
  } from "carbon-components-svelte";
</script>

<Grid padding>
  <Row>
    <Column>
      <Text>
        Resize the window (or open this example in a new tab) and watch the
        badge in the bottom corner change between breakpoints.
      </Text>
    </Column>
  </Row>
  <Row>
    <Column sm={4} md={4} lg={8}><Tile>Half at md and up</Tile></Column>
    <Column sm={4} md={4} lg={8}><Tile>Half at md and up</Tile></Column>
  </Row>
</Grid>

<GridOverlay open label />

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
