<script>
  import {
    Box,
    Button,
    Stack,
    Text,
    VirtualList,
  } from "carbon-components-svelte";

  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `web-prod-${String(i + 1).padStart(5, "0")}`,
  }));

  const TARGET = 5000;

  let list;
</script>

<Stack gap={4}>
  <Stack gap={3} orientation="horizontal" wrap="wrap">
    {#each ["start", "center", "end"] as align (align)}
      <div>
        <Button
          kind="tertiary"
          size="small"
          on:click={() => list.scrollToIndex(TARGET - 1, { align })}
        >
          Row {TARGET.toLocaleString()} at {align}
        </Button>
      </div>
    {/each}
    <div>
      <Button kind="ghost" size="small" on:click={() => list.scrollToIndex(0)}>
        Back to the top
      </Button>
    </div>
  </Stack>
  <VirtualList
    bind:this={list}
    {items}
    itemHeight={40}
    containerHeight={240}
    getKey={(item) => item.id}
    let:item
    let:index
  >
    <Box
      display="flex"
      align="center"
      height="40px"
      paddingX={5}
      border="subtle"
      borderSide="bottom"
    >
      {index + 1}. {item.name}
    </Box>
  </VirtualList>
  <Text type="body-compact-01" color="secondary">
    The row moves to the start, center or end of the list.
  </Text>
</Stack>
