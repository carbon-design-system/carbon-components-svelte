<script>
  import {
    DashboardGrid,
    DashboardGridItem,
    Layer,
    Stack,
    Text,
  } from "carbon-components-svelte";

  let layout = [
    { id: "revenue", x: 0, y: 0, w: 6, h: 2 },
    { id: "orders", x: 6, y: 0, w: 6, h: 2 },
  ];
  let message = "Drop a widget in the second row to see it refused.";

  /** @param {CustomEvent} event */
  function handleChange(event) {
    const moved = event.detail.layout.find(
      (item) => item.id === event.detail.id,
    );
    if (moved.y > 0) {
      event.preventDefault();
      message = `Refused: ${moved.id} cannot leave the first row.`;
    } else {
      message = `Accepted: ${moved.id} at column ${moved.x + 1}.`;
    }
  }
</script>

<Stack gap={5}>
  <Layer withBackground>
    <DashboardGrid
      bind:layout
      cols={12}
      rowHeight={72}
      compact="none"
      aria-label="Overview"
      on:layoutchange={handleChange}
    >
      <DashboardGridItem id="revenue" titleText="Revenue" />
      <DashboardGridItem id="orders" titleText="Orders" />
    </DashboardGrid>
  </Layer>
  <Text>{message}</Text>
</Stack>
