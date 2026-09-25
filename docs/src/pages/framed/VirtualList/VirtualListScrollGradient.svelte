<script>
  import {
    Box,
    ScrollGradient,
    Stack,
    VirtualList,
  } from "carbon-components-svelte";

  const items = Array.from({ length: 5000 }, (_, i) => ({
    id: i,
    name: `invoice-2026-${String(i + 1).padStart(5, "0")}.pdf`,
    size: `${100 + ((i * 37) % 900)} KB`,
  }));

  let scrollElementRef = null;
</script>

<ScrollGradient height="240px" bind:scrollElementRef>
  <VirtualList
    {items}
    itemHeight={40}
    containerHeight={240}
    scrollElement={scrollElementRef}
    let:item
  >
    <Stack
      as
      orientation="horizontal"
      align="center"
      justify="space-between"
      let:props
    >
      <Box
        {...props}
        height="40px"
        paddingX={5}
        border="subtle"
        borderSide="bottom"
      >
        <span>{item.name}</span>
        <span>{item.size}</span>
      </Box>
    </Stack>
  </VirtualList>
</ScrollGradient>
