<script>
  import {
    Button,
    DashboardGrid,
    DashboardGridItem,
    Layer,
    LocalStorage,
    reconcileLayout,
    Stack,
  } from "carbon-components-svelte";

  // The layouts of the widgets in this release.
  const defaults = {
    sm: [
      { id: "revenue", x: 0, y: 0, w: 4, h: 2 },
      { id: "orders", x: 0, y: 2, w: 4, h: 2 },
    ],
    lg: [
      { id: "revenue", x: 0, y: 0, w: 8, h: 2 },
      { id: "orders", x: 8, y: 0, w: 8, h: 2 },
    ],
  };

  /** What the user saved: nothing until the browser has been read. */
  let stored;
  let storage;

  // What is stored can be old: it may hold widgets that no longer exist, or
  // lack ones this release added. Fit it to the widgets you have.
  $: layouts = Object.fromEntries(
    Object.entries(defaults).map(([breakpoint, fallback]) => [
      breakpoint,
      reconcileLayout(stored?.[breakpoint], fallback),
    ]),
  );
</script>

<LocalStorage
  bind:this={storage}
  key="dashboard-grid-layouts"
  bind:value={stored}
/>

<Stack gap={5}>
  <Button size="small" kind="tertiary" on:click={() => storage.clearItem()}>
    Reset layout
  </Button>
  <Layer withBackground>
    <DashboardGrid
      {layouts}
      rowHeight={72}
      aria-label="Overview"
      on:layoutchange={(event) => (stored = event.detail.layouts)}
    >
      <DashboardGridItem id="revenue" titleText="Revenue"
        >$1.2M</DashboardGridItem
      >
      <DashboardGridItem id="orders" titleText="Orders">4,820</DashboardGridItem
      >
    </DashboardGrid>
  </Layer>
</Stack>
