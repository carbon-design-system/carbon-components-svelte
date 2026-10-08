<script>
  import {
    Column,
    Grid,
    GridOverlay,
    Row,
    Stack,
    Text,
    Tile,
    Toggle,
  } from "carbon-components-svelte";

  let fullWidth = false;
</script>

<Grid padding {fullWidth}>
  <Row>
    <Column>
      <Stack gap={5}>
        <Toggle labelText="fullWidth" size="sm" bind:toggled={fullWidth} />
        <Text>
          The hatched bands are the grid's outer margins. Content in them has
          escaped the grid. At 1584px and up, the default grid stops growing, so
          the margins widen; a full-width grid keeps them fixed.
        </Text>
      </Stack>
    </Column>
  </Row>
  <Row>
    <Column><Tile>Inside the grid</Tile></Column>
  </Row>
</Grid>

<Tile style="margin-top: 1rem; width: 24rem; max-width: 100%;">
  Outside any Grid: this tile starts in the margin.
</Tile>

<GridOverlay open margins {fullWidth} />

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
