<script>
  import {
    Button,
    FloatingPortal,
    Stack,
    Tile,
  } from "carbon-components-svelte";

  let anchorTop = null;
  let anchorBottom = null;
  let openTop = false;
  let openBottom = false;
</script>

<Stack gap={5}>
  <div>
    <Button bind:ref={anchorBottom} on:click={() => (openBottom = !openBottom)}>
      Direction: bottom (default)
    </Button>

    <FloatingPortal anchor={anchorBottom} open={openBottom} direction="bottom">
      <Tile>Content</Tile>
    </FloatingPortal>
  </div>

  <div>
    <Button bind:ref={anchorTop} on:click={() => (openTop = !openTop)}>
      Direction: top
    </Button>

    <FloatingPortal anchor={anchorTop} open={openTop} direction="top">
      <Tile>Content</Tile>
    </FloatingPortal>
  </div>
</Stack>
