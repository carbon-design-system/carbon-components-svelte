<script>
  import {
    Button,
    Column,
    Grid,
    GridOverlay,
    Row,
    Tile,
  } from "carbon-components-svelte";

  let open = true;
</script>

<Grid fullWidth padding>
  <Row>
    <Column>
      <Button on:click={() => (open = !open)}>
        {open ? "Hide" : "Show"}
        full-width grid overlay
      </Button>
    </Column>
  </Row>
  <Row>
    <Column sm={4} md={8} lg={16}><Tile>Header</Tile></Column>
  </Row>
  <Row>
    <Column sm={4} md={5} lg={11}><Tile>Content</Tile></Column>
    <Column sm={4} md={3} lg={5}><Tile>Sidebar</Tile></Column>
  </Row>
  <Row>
    <Column sm={2} md={2} lg={4}><Tile>Card</Tile></Column>
    <Column sm={2} md={2} lg={4}><Tile>Card</Tile></Column>
    <Column sm={2} md={2} lg={4}><Tile>Card</Tile></Column>
    <Column sm={2} md={2} lg={4}><Tile>Card</Tile></Column>
  </Row>
</Grid>

<GridOverlay {open} fullWidth />

<!-- docs-only:start -->
<style>
  /* The overlay is fixed to the viewport, so drop the frame's side padding
     to line the Grid up with it, and hide the frame's column outlines. */
  :global(body.framed) {
    padding-inline: 0;
  }

  :global(body.framed :not(.bx--content) [class^="bx--col"]) {
    outline: 0;
  }
</style>
<!-- docs-only:end -->
