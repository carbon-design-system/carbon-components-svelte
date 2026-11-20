<script>
  import {
    Button,
    DashboardGrid,
    DashboardGridItem,
    Layer,
    Stack,
  } from "carbon-components-svelte";

  let editing = false;

  let layout = [
    { id: "revenue", x: 0, y: 0, w: 6, h: 2 },
    { id: "orders", x: 6, y: 0, w: 6, h: 2 },
  ];
</script>

<Stack gap={5}>
  <Button size="small" kind="tertiary" on:click={() => (editing = !editing)}>
    {editing ? "Done" : "Edit layout"}
  </Button>
  <Layer withBackground>
    <DashboardGrid
      bind:layout
      cols={12}
      rowHeight={72}
      draggable={editing}
      resizable={editing}
      aria-label="Overview"
    >
      <DashboardGridItem id="revenue" titleText="Revenue"
        >$1.2M</DashboardGridItem
      >
      <DashboardGridItem id="orders" titleText="Orders">
        <Button size="small" kind="ghost">Open</Button>
      </DashboardGridItem>
    </DashboardGrid>
  </Layer>
</Stack>
