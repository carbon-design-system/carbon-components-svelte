<script>
  import {
    Column,
    Grid,
    GridOverlay,
    Row,
    Slider,
    Stack,
    Text,
  } from "carbon-components-svelte";

  let baselineEmphasis = 4;
</script>

<Grid padding>
  <Row>
    <Column sm={4} md={6} lg={8}>
      <Stack gap={6}>
        <Slider
          labelText="baselineEmphasis"
          min={0}
          max={8}
          bind:value={baselineEmphasis}
        />
        <Text>
          With an 8px step, <code>2</code> marks every 16px and
          <code>4</code>
          marks every 32px. <code>0</code> or <code>1</code>
          draws every row the same.
        </Text>
      </Stack>
    </Column>
  </Row>
</Grid>

<GridOverlay open columns={false} baseline={8} {baselineEmphasis} />

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
