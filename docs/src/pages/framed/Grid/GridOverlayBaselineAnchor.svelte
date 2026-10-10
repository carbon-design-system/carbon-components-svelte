<script>
  import {
    Column,
    ContentSwitcher,
    Grid,
    GridOverlay,
    Row,
    Stack,
    Switch,
    Text,
    Tile,
  } from "carbon-components-svelte";

  const anchors = ["page", "viewport"];

  let selectedIndex = 0;
</script>

<Grid padding>
  <Row>
    <Column>
      <Stack gap={6}>
        <ContentSwitcher bind:selectedIndex size="sm">
          <Switch text="page" />
          <Switch text="viewport" />
        </ContentSwitcher>
        <Text>
          Scroll this frame. With <code>"page"</code>, the rows move with the
          tiles. With <code>"viewport"</code>, the rows stay still and the tiles
          slide under them.
        </Text>
        {#each [1, 2, 3, 4, 5] as n}
          <Tile style="height: 6rem;">Tile {n}</Tile>
        {/each}
      </Stack>
    </Column>
  </Row>
</Grid>

<GridOverlay
  open
  columns={false}
  baseline={16}
  baselineEmphasis={0}
  baselineAnchor={anchors[selectedIndex]}
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
