<script lang="ts">
  import DashboardGrid from "carbon-components-svelte/DashboardGrid/DashboardGrid.svelte";
  import DashboardGridItem from "carbon-components-svelte/DashboardGrid/DashboardGridItem.svelte";
  import type { ComponentProps } from "svelte";

  export let cols: ComponentProps<DashboardGrid>["cols"] = 4;
  export let layout: ComponentProps<DashboardGrid>["layout"] = [
    { id: "a", x: 0, y: 0, w: 2, h: 2 },
    { id: "b", x: 2, y: 0, w: 2, h: 2 },
    { id: "c", x: 0, y: 2, w: 4, h: 1, static: true },
  ];
  export let layouts: ComponentProps<DashboardGrid>["layouts"] = {};
  export let draggable = true;
  export let resizable = true;
  export let prevent = false;
  export let dir: "ltr" | "rtl" | undefined = undefined;

  let log: string[] = [];
</script>

<div {dir}>
  <DashboardGrid
    bind:layout
    bind:layouts
    {cols}
    {draggable}
    {resizable}
    aria-label="Operations"
    data-testid="grid"
    on:layoutchange={(event) => {
      if (prevent) event.preventDefault();
      const { id, type, source, breakpoint, layout: next } = event.detail;
      log = [
        ...log,
        `${type}:${source}:${breakpoint}:${id}:${next
          .map((i) => `${i.id}@${i.x},${i.y},${i.w}x${i.h}`)
          .join(" ")}`,
      ];
    }}
  >
    <DashboardGridItem id="a" titleText="Alpha" data-testid="a">
      <button type="button">Inside</button>
    </DashboardGridItem>
    <DashboardGridItem id="b" titleText="Beta" data-testid="b" />
    <DashboardGridItem id="c" titleText="Gamma" data-testid="c" />
  </DashboardGrid>
  <pre data-testid="log">{log.join("\n")}</pre>
</div>
