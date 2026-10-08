<script>
  import {
    Column,
    Grid,
    GridOverlay,
    LocalStorage,
    Row,
    Text,
    Tile,
  } from "carbon-components-svelte";

  let open = false;
</script>

<svelte:window
  on:keydown={(e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "g") {
      e.preventDefault();
      open = !open;
    }
  }}
/>

<LocalStorage key="grid-overlay-open" bind:value={open} />

<Grid padding>
  <Row>
    <Column>
      <Text>
        Click inside this frame, then press Ctrl+Shift+G (or Cmd+Shift+G). The
        state survives a reload.
      </Text>
    </Column>
  </Row>
  <Row>
    <Column sm={4} md={5} lg={11}><Tile>Content</Tile></Column>
    <Column sm={4} md={3} lg={5}><Tile>Sidebar</Tile></Column>
  </Row>
</Grid>

<GridOverlay {open} baseline={8} label />

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
