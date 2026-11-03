<script>
  import {
    DashboardGrid,
    DashboardGridItem,
    Layer,
  } from "carbon-components-svelte";

  let layout = [
    { id: "revenue", x: 0, y: 0, w: 6, h: 2 },
    { id: "orders", x: 6, y: 0, w: 6, h: 2 },
    { id: "alerts", x: 0, y: 2, w: 12, h: 2 },
  ];
</script>

<Layer withBackground>
  <DashboardGrid bind:layout cols={12} rowHeight={72} aria-label="Overview">
    <DashboardGridItem id="revenue" titleText="Revenue">$1.2M</DashboardGridItem
    >
    <DashboardGridItem id="orders" titleText="Orders">4,820</DashboardGridItem>
    <DashboardGridItem id="alerts" titleText="Alerts">3 open</DashboardGridItem>
  </DashboardGrid>
</Layer>
