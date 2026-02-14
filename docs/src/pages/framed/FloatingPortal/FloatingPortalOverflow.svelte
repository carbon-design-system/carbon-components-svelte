<script>
  import {
    Button,
    FloatingPortal,
    Stack,
    Tile,
  } from "carbon-components-svelte";

  let anchor = null;
  let open = false;
</script>

<Stack gap={4} style="overflow: hidden; border: 1px dashed var(--cds-border-subtle); padding: 1rem">
  <div>This container has hidden overflow.</div>
  <Button bind:ref={anchor} on:click={() => (open = !open)}>
    Toggle floating content
  </Button>
</Stack>

<FloatingPortal {anchor} {open}>
  <Tile>Content</Tile>
</FloatingPortal>
