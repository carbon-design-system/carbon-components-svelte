<script>
  import { Portal, Stack, Tile } from "carbon-components-svelte";

  let target = null;
</script>

<Stack gap={4}>
  <Tile>
    <div>Portal is declared here.</div>
    <Portal {target}><strong>Portalled content</strong></Portal>
  </Tile>
  <Tile>
    <div bind:this={target}>
      But mounted into this container via <code>target</code>.
    </div>
  </Tile>
</Stack>
