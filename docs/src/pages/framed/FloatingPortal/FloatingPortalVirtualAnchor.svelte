<script>
  import {
    Box,
    FloatingPortal,
    pointAnchor,
    Stack,
    Tile,
  } from "carbon-components-svelte";

  let open = false;
  let anchor = null;

  /** @param {MouseEvent} event */
  function handleClick(event) {
    // A point is an anchor: it only has to answer `getBoundingClientRect()`.
    anchor = pointAnchor(event.clientX, event.clientY);
    open = true;
  }
</script>

<Stack gap={5}>
  <p>Click anywhere in the box to place a tile at the pointer.</p>

  <Box
    role="presentation"
    border="strong"
    padding={7}
    minHeight="200px"
    on:click={handleClick}
  >
    Click here
  </Box>
</Stack>

<FloatingPortal
  {anchor}
  {open}
  direction="bottom"
  intrinsicWidth
  intrinsicAlign="start"
  flipAlign
  padding={8}
>
  <Tile>
    <Stack gap={3}>
      <span>Placed at the pointer.</span>
      <button type="button" on:click={() => (open = false)}>Close</button>
    </Stack>
  </Tile>
</FloatingPortal>
