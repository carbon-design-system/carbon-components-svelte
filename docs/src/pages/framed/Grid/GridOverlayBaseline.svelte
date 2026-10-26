<script>
  import {
    Box,
    Button,
    Column,
    Grid,
    Heading,
    Row,
    Stack,
    Text,
    Tile,
  } from "carbon-components-svelte";
  import { GridOverlay } from "carbon-components-svelte/devtools";

  let open = true;
</script>

<Grid padding>
  <Row>
    <Column>
      <Stack gap={7}>
        <div>
          <Button size="small" on:click={() => (open = !open)}>
            {open ? "Hide" : "Show"}
            overlay
          </Button>
        </div>
        <Heading type="heading-05">Baseline rhythm</Heading>
        <Text type="body-02">
          Every spacing token in Carbon is a multiple of the 8px mini unit. With
          an 8px baseline, tops and bottoms of boxes should land on a row.
          Scroll down: the rows move with the page, so they stay on the same
          content.
        </Text>
        <Box height="8rem">
          <Tile fullHeight>An 8rem (128px) tile: 16 rows tall.</Tile>
        </Box>
        <Box height="5.25rem">
          <Tile fullHeight>A 5.25rem (84px) tile: off the rhythm.</Tile>
        </Box>
        <Text type="body-02">
          Every fourth row is darker, marking 32px steps. Use
          <code>baselineEmphasis</code>
          to change it.
        </Text>
        <Box height="12rem">
          <Tile fullHeight>A 12rem (192px) tile.</Tile>
        </Box>
        <Box height="12rem">
          <Tile fullHeight>Another 12rem tile, to make the page scroll.</Tile>
        </Box>
      </Stack>
    </Column>
  </Row>
</Grid>

<GridOverlay {open} baseline={8} />

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
