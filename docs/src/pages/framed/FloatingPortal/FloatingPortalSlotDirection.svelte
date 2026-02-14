<script>
  import {
    Button,
    FloatingPortal,
    Stack,
    Tag,
    Tile,
  } from "carbon-components-svelte";

  let anchor = null;
  let open = false;
</script>

<Button bind:ref={anchor} on:click={() => (open = !open)}>
  Toggle floating content
</Button>

<FloatingPortal {anchor} {open} let:direction>
  <Tile>
    <Stack orientation="horizontal" align="center" gap={2}>
      Actual direction: <Tag size="sm">{direction}</Tag>
    </Stack>
  </Tile>
</FloatingPortal>
