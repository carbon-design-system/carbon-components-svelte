<script>
  import {
    DashboardGrid,
    DashboardGridItem,
    Layer,
  } from "carbon-components-svelte";

  // Only the wide layout is given. The others are derived from it: fitted
  // to 8 and 4 columns and stacked.
  let layouts = {
    lg: [
      { id: "revenue", x: 0, y: 0, w: 8, h: 2 },
      { id: "orders", x: 8, y: 0, w: 8, h: 2 },
      { id: "latency", x: 0, y: 2, w: 16, h: 2 },
    ],
  };
</script>

<Layer withBackground>
  <DashboardGrid bind:layouts rowHeight={72} aria-label="Overview">
    <DashboardGridItem id="revenue" titleText="Revenue">$1.2M</DashboardGridItem
    >
    <DashboardGridItem id="orders" titleText="Orders">4,820</DashboardGridItem>
    <DashboardGridItem id="latency" titleText="Latency">
      p95 212 ms
    </DashboardGridItem>
  </DashboardGrid>
</Layer>
