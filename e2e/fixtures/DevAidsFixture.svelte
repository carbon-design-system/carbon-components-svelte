<script>
  import "carbon-components-svelte/css/devtools.css";
  import { Button, Stack, Text, Tile } from "carbon-components-svelte";
  import {
    DevToolbar,
    GridOverlay,
    LayoutInspector,
  } from "carbon-components-svelte/devtools";
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
<LayoutInspector open enterDelayMs={0} checkSpacing checkTargets />
<DevToolbar persist={false} />
