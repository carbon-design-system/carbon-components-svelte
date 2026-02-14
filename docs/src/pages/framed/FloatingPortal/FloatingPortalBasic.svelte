<script>
  import { Button, FloatingPortal, Tile } from "carbon-components-svelte";

  let anchor = null;
  let open = false;
</script>

<Button bind:ref={anchor} on:click={() => (open = !open)}>
  Toggle floating content
</Button>

<FloatingPortal {anchor} {open}>
  <Tile>Content</Tile>
</FloatingPortal>
