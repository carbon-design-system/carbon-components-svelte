<script>
  import { Box, Stack, Text, VirtualList } from "carbon-components-svelte";

  const items = Array.from({ length: 100000 }, (_, i) => ({
    id: i,
    name: `web-prod-${String(i + 1).padStart(6, "0")}`,
  }));

  let list;
  let active = 0;

  /** @param {number} next */
  function move(next) {
    active = Math.max(0, Math.min(items.length - 1, next));
    list.scrollToIndex(active, { align: "nearest" });
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    const moves = {
      ArrowDown: active + 1,
      ArrowUp: active - 1,
      PageDown: active + 6,
      PageUp: active - 6,
      Home: 0,
      End: items.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    move(moves[event.key]);
  }
</script>

<Stack gap={4}>
  <!-- Keys bubble up from the listbox, which holds the one tab stop. -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div on:keydown={onKeydown}>
    <VirtualList
      bind:this={list}
      role="listbox"
      tabindex="0"
      aria-label="Instances"
      aria-activedescendant="instance-{active}"
      {items}
      itemHeight={40}
      containerHeight={240}
      keepMounted={[active]}
      getKey={(item) => item.id}
      let:item
    >
      <div
        id="instance-{item.id}"
        role="option"
        aria-selected={item.id === active}
        aria-posinset={item.id + 1}
        aria-setsize={items.length}
      >
        <Box
          display="flex"
          align="center"
          height="40px"
          paddingX={5}
          border="subtle"
          borderSide="bottom"
          fill={item.id === active ? "layer-accent" : undefined}
        >
          {item.name}
        </Box>
      </div>
    </VirtualList>
  </div>
  <Text type="body-compact-01" color="secondary">
    Active option: {active + 1}. Press End, then PageUp, and the listbox always
    names an option that is in the page.
  </Text>
</Stack>
