<script>
  import {
    DashboardGrid,
    DashboardGridItem,
    Layer,
    Stack,
    Toggle,
  } from "carbon-components-svelte";

  let compact = true;
  let prevent = false;

  let layout = [
    { id: "a", x: 0, y: 0, w: 4, h: 2 },
    { id: "b", x: 4, y: 0, w: 4, h: 2 },
    { id: "c", x: 8, y: 0, w: 4, h: 2 },
    { id: "d", x: 0, y: 2, w: 6, h: 2 },
  ];
</script>

<Stack gap={5}>
  <Toggle size="sm" labelText="Compact" bind:toggled={compact} />
  <Toggle size="sm" labelText="Prevent collision" bind:toggled={prevent} />
  <Layer withBackground>
    <DashboardGrid
      bind:layout
      cols={12}
      rowHeight={56}
      compact={compact ? "vertical" : "none"}
      collision={prevent ? "prevent" : "push"}
      aria-label="Compaction"
    >
      {#each layout as item (item.id)}
        <DashboardGridItem id={item.id} titleText={`Widget ${item.id}`} />
      {/each}
    </DashboardGrid>
  </Layer>
</Stack>
