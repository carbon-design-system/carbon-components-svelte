<script>
  import {
    Button,
    FloatingPortal,
    Stack,
    Tag,
    Tile,
  } from "carbon-components-svelte";

  let anchorStart = null;
  let anchorEnd = null;
  let openStart = false;
  let openEnd = false;
</script>

<Stack gap={5}>
  <p>
    Both boxes ask for <code>intrinsicAlign="start"</code>, the anchor's left
    edge. The one at the window's right edge would run past it, so it takes the
    anchor's right edge. The slot's <code>align</code> says which one it settled on.
  </p>

  <Stack orientation="horizontal" justify="space-between" align="start">
    <div>
      <div bind:this={anchorStart}>
        <Button on:click={() => (openStart = !openStart)}
          >Start of the page</Button
        >
      </div>
      <FloatingPortal
        anchor={anchorStart}
        open={openStart}
        intrinsicWidth
        intrinsicAlign="start"
        flipAlign
        let:align
      >
        <Tile>
          <Stack orientation="horizontal" align="center" gap={2}>
            Aligned <Tag size="sm">{align}</Tag>
          </Stack>
        </Tile>
      </FloatingPortal>
    </div>

    <div>
      <div bind:this={anchorEnd}>
        <Button on:click={() => (openEnd = !openEnd)}>End of the page</Button>
      </div>
      <FloatingPortal
        anchor={anchorEnd}
        open={openEnd}
        intrinsicWidth
        intrinsicAlign="start"
        flipAlign
        let:align
      >
        <Tile>
          <Stack orientation="horizontal" align="center" gap={2}>
            Aligned <Tag size="sm">{align}</Tag>
          </Stack>
        </Tile>
      </FloatingPortal>
    </div>
  </Stack>
</Stack>
