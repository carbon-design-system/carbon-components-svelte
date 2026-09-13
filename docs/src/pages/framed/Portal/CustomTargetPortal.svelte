<script>
  import { Portal, Stack, Tile } from "carbon-components-svelte";

  let target = null;
</script>

<Stack gap={4}>
  <Tile>
    <div>Widget declared in the sidebar.</div>
    <Portal {target}><strong>3 incidents open</strong></Portal>
  </Tile>
  <Tile>
    <div bind:this={target}>
      But mounted into the dashboard's main panel via <code>target</code>.
    </div>
  </Tile>
</Stack>
