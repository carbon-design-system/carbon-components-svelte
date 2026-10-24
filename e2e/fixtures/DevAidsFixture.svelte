<script>
  import {
    Button,
    DevToolbar,
    GridOverlay,
    LayoutInspector,
    Stack,
    Text,
    Tile,
  } from "carbon-components-svelte";
</script>

<Stack gap={5}>
  <Text data-testid="paragraph">
    A paragraph whose glyph baselines miss the 8px rows, so each line gets an
    offset label.
  </Text>
  <Tile data-testid="tile">A tile to hover</Tile>
  <Button size="small">Small button</Button>
</Stack>

<GridOverlay open gutters margins label baseline={8} textBaselines />
<LayoutInspector open enterDelayMs={0} lint targets />
<DevToolbar persist={false} />
