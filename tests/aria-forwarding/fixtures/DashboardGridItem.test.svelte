<script lang="ts">
  import DashboardGrid from "carbon-components-svelte/DashboardGrid/DashboardGrid.svelte";
  import DashboardGridItem from "carbon-components-svelte/DashboardGrid/DashboardGridItem.svelte";
</script>

<DashboardGrid cols={4} layout={[{ id: "a", x: 0, y: 0, w: 2, h: 2 }]}>
  <DashboardGridItem id="a" {...$$restProps} />
</DashboardGrid>
