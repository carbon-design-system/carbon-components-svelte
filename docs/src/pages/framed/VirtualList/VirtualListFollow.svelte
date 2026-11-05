<script>
  import {
    Box,
    Button,
    Stack,
    Text,
    VirtualList,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";

  const levels = ["info", "info", "info", "warn", "error"];

  /** @param {number} n */
  const makeLine = (n) => ({
    id: n,
    text: `${String(n + 1).padStart(5, "0")}  ${levels[n % levels.length]}  worker-${(n % 4) + 1} handled request ${n * 7}`,
  });

  let items = Array.from({ length: 200 }, (_, i) => makeLine(i));
  let atEnd = true;
  let list;
  let paused = false;

  onMount(() => {
    // Fifty lines a second.
    const timer = setInterval(() => {
      if (paused) return;
      items = [...items, makeLine(items.length)];
    }, 20);
    return () => clearInterval(timer);
  });
</script>

<Stack gap={4}>
  <Stack gap={3} orientation="horizontal" align="center">
    <div>
      <Button kind="tertiary" size="small" on:click={() => (paused = !paused)}>
        {paused ? "Resume the stream" : "Pause the stream"}
      </Button>
    </div>
    <div>
      <Button
        kind="primary"
        size="small"
        disabled={atEnd}
        on:click={() => list.scrollToEnd()}
      >
        Jump to latest
      </Button>
    </div>
  </Stack>
  <VirtualList
    bind:this={list}
    bind:atEnd
    follow="end"
    {items}
    itemHeight={24}
    containerHeight={240}
    getKey={(item) => item.id}
    let:item
  >
    <Box display="flex" align="center" height="24px" paddingX={5}>
      <code>{item.text}</code>
    </Box>
  </VirtualList>
  <Text type="body-compact-01" color="secondary">
    {items.length.toLocaleString()} lines.
    {atEnd
      ? "Following the newest line."
      : "Scrolled back: new lines arrive without moving the list."}
  </Text>
</Stack>
