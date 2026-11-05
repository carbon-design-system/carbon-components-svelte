<script>
  import { Box, Text, VirtualList } from "carbon-components-svelte";

  const SECTIONS = 200;
  const PER_SECTION = 50;

  /** One header per section, then its rows. */
  const items = [];
  /** @type {number[]} */
  const headerIndices = [];

  for (let section = 0; section < SECTIONS; section++) {
    headerIndices.push(items.length);
    items.push({
      id: `section-${section}`,
      header: true,
      label: `Region ${section + 1}`,
    });
    for (let row = 0; row < PER_SECTION; row++) {
      items.push({
        id: `section-${section}-${row}`,
        header: false,
        label: `web-${section + 1}-${String(row + 1).padStart(3, "0")}`,
      });
    }
  }
</script>

<VirtualList
  {items}
  stickyIndices={headerIndices}
  itemHeight={40}
  containerHeight={240}
  getKey={(item) => item.id}
  let:item
>
  <Box
    display="flex"
    align="center"
    height="40px"
    paddingX={5}
    border="subtle"
    borderSide="bottom"
    fill={item.header ? "layer-accent" : undefined}
  >
    {#if item.header}
      <Text type="heading-compact-01">{item.label}</Text>
    {:else}
      {item.label}
    {/if}
  </Box>
</VirtualList>
