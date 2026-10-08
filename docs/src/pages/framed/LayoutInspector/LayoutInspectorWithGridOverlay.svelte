<script>
  import {
    Column,
    Grid,
    GridOverlay,
    LayoutInspector,
    LocalStorage,
    Row,
    Text,
    Tile,
  } from "carbon-components-svelte";

  let grid = true;
  let inspector = true;
</script>

<svelte:window
  on:keydown={(e) => {
    if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;
    const key = e.key.toLowerCase();
    if (key === "g") {
      e.preventDefault();
      grid = !grid;
    } else if (key === "l") {
      e.preventDefault();
      inspector = !inspector;
    }
  }}
/>

<LocalStorage key="dev-grid" bind:value={grid} />
<LocalStorage key="dev-inspector" bind:value={inspector} />

<Grid padding>
  <Row>
    <Column>
      <Text>
        Ctrl+Shift+G toggles the grid. Ctrl+Shift+L toggles the inspector. Use
        Cmd on macOS. Both settings survive a reload.
      </Text>
    </Column>
  </Row>
  <Row>
    <Column sm={4} md={5} lg={11}><Tile>Content</Tile></Column>
    <Column sm={4} md={3} lg={5}><Tile>Sidebar</Tile></Column>
  </Row>
</Grid>

<GridOverlay open={grid} baseline={8} label />
<LayoutInspector open={inspector} />

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
