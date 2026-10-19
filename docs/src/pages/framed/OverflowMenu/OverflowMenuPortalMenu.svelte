<script>
  import {
    Box,
    OverflowMenu,
    OverflowMenuItem,
  } from "carbon-components-svelte";
</script>

<Box
  display="flex"
  direction="column"
  gap={4}
  overflow="hidden"
  border="subtle"
  borderStyle="dashed"
  padding={5}
  maxHeight="120px"
>
  <div>
    This container has hidden overflow. The menu would not fit, so it opens in a
    portal.
  </div>
  <OverflowMenu>
    <OverflowMenuItem text="Edit" />
    <OverflowMenuItem text="Duplicate" />
    <OverflowMenuItem danger text="Delete" />
  </OverflowMenu>
</Box>
