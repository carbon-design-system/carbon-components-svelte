<script>
  import {
    Box,
    Button,
    Stack,
    Text,
    VirtualList,
  } from "carbon-components-svelte";

  const PAGE_SIZE = 50;

  /** @param {number} from @param {number} to */
  const makeRows = (from, to) =>
    Array.from({ length: to - from }, (_, i) => ({
      id: from + i,
      message: `Comment ${from + i + 1}`,
    }));

  let oldest = 1000;
  let items = makeRows(oldest, 3000);

  function loadOlder() {
    oldest -= PAGE_SIZE;
    items = [...makeRows(oldest, oldest + PAGE_SIZE), ...items];
  }
</script>

<Stack gap={4}>
  <div>
    <Button size="small" disabled={oldest === 0} on:click={loadOlder}>
      Load {PAGE_SIZE} older comments
    </Button>
  </div>
  <VirtualList
    {items}
    itemHeight={40}
    containerHeight={240}
    getKey={(item) => item.id}
    initialScrollTop={40 * 1000}
    let:item
  >
    <Box
      display="flex"
      align="center"
      height="40px"
      paddingX={5}
      border="subtle"
      borderSide="bottom"
    >
      {item.message}
    </Box>
  </VirtualList>
  <Text type="body-compact-01" color="secondary">
    {items.length.toLocaleString()} comments loaded. Scroll away from the top, then
    load older ones: the comment in view stays where it is.
  </Text>
</Stack>
