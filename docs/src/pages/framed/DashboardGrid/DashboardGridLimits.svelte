<script>
  import {
    DashboardGrid,
    DashboardGridItem,
    Layer,
  } from "carbon-components-svelte";

  let layout = [
    // Stays where it is, and the others flow around it.
    { id: "pinned", x: 0, y: 0, w: 12, h: 1, static: true },
    // Resizes between 3 and 8 columns, and 2 and 3 rows.
    {
      id: "limited",
      x: 0,
      y: 1,
      w: 4,
      h: 2,
      minW: 3,
      maxW: 8,
      minH: 2,
      maxH: 3,
    },
    { id: "free", x: 4, y: 1, w: 4, h: 2 },
  ];
</script>

<Layer withBackground>
  <DashboardGrid bind:layout cols={12} rowHeight={56} aria-label="Limits">
    <DashboardGridItem id="pinned" titleText="Pinned"
      >Cannot move.</DashboardGridItem
    >
    <DashboardGridItem id="limited" titleText="Limited"
      >3 to 8 wide.</DashboardGridItem
    >
    <DashboardGridItem id="free" titleText="Free" />
  </DashboardGrid>
</Layer>
