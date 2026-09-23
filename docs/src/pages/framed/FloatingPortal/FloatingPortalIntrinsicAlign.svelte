<script>
  import {
    Button,
    FloatingPortal,
    Stack,
    Tile,
  } from "carbon-components-svelte";

  let anchorStart = null;
  let anchorCenter = null;
  let anchorEnd = null;
  let openStart = false;
  let openCenter = false;
  let openEnd = false;
</script>

<Stack gap={5}>
  <p>
    With <code>intrinsicWidth</code>, use <code>intrinsicAlign</code> to pin the
    floating box to the start, center, or end of the anchor along the cross axis
    (horizontal for top/bottom).
  </p>

  <Stack orientation="horizontal" gap={9} wrap="wrap" align="start">
    <div>
      <div bind:this={anchorStart}>
        <Button on:click={() => (openStart = !openStart)}>Start</Button>
      </div>
      <FloatingPortal
        anchor={anchorStart}
        open={openStart}
        intrinsicWidth={true}
        intrinsicAlign="start"
      >
        <Tile>Align start</Tile>
      </FloatingPortal>
    </div>

    <div>
      <div bind:this={anchorCenter}>
        <Button on:click={() => (openCenter = !openCenter)}>Center</Button>
      </div>
      <FloatingPortal
        anchor={anchorCenter}
        open={openCenter}
        intrinsicWidth={true}
        intrinsicAlign="center"
      >
        <Tile>Align center</Tile>
      </FloatingPortal>
    </div>

    <div>
      <div bind:this={anchorEnd}>
        <Button on:click={() => (openEnd = !openEnd)}>End</Button>
      </div>
      <FloatingPortal
        anchor={anchorEnd}
        open={openEnd}
        intrinsicWidth={true}
        intrinsicAlign="end"
      >
        <Tile>Align end</Tile>
      </FloatingPortal>
    </div>
  </Stack>
</Stack>
