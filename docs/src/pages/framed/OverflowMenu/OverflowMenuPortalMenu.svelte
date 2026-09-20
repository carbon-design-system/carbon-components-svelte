<script>
  import {
    Box,
    OverflowMenu,
    OverflowMenuItem,
    Stack,
  } from "carbon-components-svelte";
</script>

<Box
  overflow="hidden"
  border="subtle"
  borderStyle="dashed"
  padding={5}
  maxHeight="120px"
>
  <Stack gap={4}>
    <div>
      This container has hidden overflow. Without <code>portalMenu</code>, the
      menu would be clipped.
    </div>
    <OverflowMenu portalMenu>
      <OverflowMenuItem text="Edit" />
      <OverflowMenuItem text="Duplicate" />
      <OverflowMenuItem danger text="Delete" />
    </OverflowMenu>
  </Stack>
</Box>
