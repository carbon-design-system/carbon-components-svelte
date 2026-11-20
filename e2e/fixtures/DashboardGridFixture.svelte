<script>
  import {
    Button,
    DashboardGrid,
    DashboardGridItem,
    DataTable,
    Layer,
    TextInput,
  } from "carbon-components-svelte";

  const defaults = {
    sm: [
      { id: "revenue", x: 0, y: 0, w: 4, h: 3 },
      { id: "orders", x: 0, y: 3, w: 4, h: 3 },
      { id: "alerts", x: 0, y: 6, w: 4, h: 3 },
      { id: "table", x: 0, y: 9, w: 4, h: 4 },
      { id: "notes", x: 0, y: 13, w: 4, h: 3 },
      { id: "pinned", x: 0, y: 16, w: 4, h: 2, static: true },
    ],
    lg: [
      { id: "revenue", x: 0, y: 0, w: 6, h: 3, minW: 2, minH: 2 },
      { id: "orders", x: 6, y: 0, w: 5, h: 3 },
      { id: "alerts", x: 11, y: 0, w: 5, h: 3 },
      { id: "table", x: 0, y: 3, w: 10, h: 4 },
      { id: "notes", x: 10, y: 3, w: 6, h: 2 },
      { id: "pinned", x: 10, y: 5, w: 6, h: 2, static: true },
    ],
  };

  let layouts = defaults;
  let log = [];
  let clicks = 0;
  let value = "";
  let prevent = false;
  let draggable = true;
  let resizable = true;
  let compact = "vertical";
  let collision = "push";

  const headers = [
    { key: "name", value: "Name" },
    { key: "region", value: "Region" },
  ];
  const rows = Array.from({ length: 12 }, (_, n) => ({
    id: String(n),
    name: `Service ${n + 1}`,
    region: n % 2 ? "us-south" : "eu-de",
  }));

  /** @param {CustomEvent} event */
  function handleChange(event) {
    if (prevent) event.preventDefault();
    log = [
      ...log,
      `${event.detail.type}:${event.detail.source}:${event.detail.breakpoint}:${event.detail.layout
        .map((i) => `${i.id}@${i.x},${i.y} ${i.w}x${i.h}`)
        .join(" ")}`,
    ];
  }
</script>

<main data-testid="page">
  <div class="controls">
    <label
      ><input type="checkbox" data-testid="prevent" bind:checked={prevent} />
      Cancel changes</label
    >
    <label
      ><input
        type="checkbox"
        data-testid="draggable"
        bind:checked={draggable}
      />
      Draggable</label
    >
    <label
      ><input
        type="checkbox"
        data-testid="resizable"
        bind:checked={resizable}
      />
      Resizable</label
    >
    <label
      ><input
        type="checkbox"
        data-testid="compact"
        checked={compact === "vertical"}
        on:change={(event) =>
          (compact = event.currentTarget.checked ? "vertical" : "none")}
      />
      Compact</label
    >
    <label
      ><input
        type="checkbox"
        data-testid="prevent-collision"
        checked={collision === "prevent"}
        on:change={(event) =>
          (collision = event.currentTarget.checked ? "prevent" : "push")}
      />
      Prevent collision</label
    >
  </div>

  <DashboardGrid
    bind:layouts
    {draggable}
    {resizable}
    {compact}
    {collision}
    aria-label="Operations"
    data-testid="grid"
    on:layoutchange={handleChange}
  >
    <DashboardGridItem id="revenue" titleText="Revenue" data-testid="revenue">
      <p>$1.2M</p>
    </DashboardGridItem>
    <DashboardGridItem id="orders" titleText="Orders" data-testid="orders">
      <Button size="small" on:click={() => (clicks += 1)}>Count</Button>
      <span data-testid="clicks">{clicks}</span>
    </DashboardGridItem>
    <DashboardGridItem id="alerts" titleText="Alerts" data-testid="alerts">
      <TextInput labelText="Filter" bind:value />
      <span data-testid="value">{value}</span>
    </DashboardGridItem>
    <DashboardGridItem
      id="table"
      titleText="Services"
      noPadding
      data-testid="table"
    >
      <DataTable size="short" {headers} {rows} />
    </DashboardGridItem>
    <DashboardGridItem id="notes" titleText="Notes" data-testid="notes">
      <p>Pick up with Enter.</p>
      <svelte:fragment slot="actions">
        <Button size="small" kind="ghost">Edit</Button>
      </svelte:fragment>
    </DashboardGridItem>
    <DashboardGridItem id="pinned" titleText="Pinned" data-testid="pinned">
      <Layer><p>Cannot move.</p></Layer>
    </DashboardGridItem>
  </DashboardGrid>

  <pre data-testid="log">{log.join("\n")}</pre>
  <pre data-testid="layouts">{JSON.stringify(layouts)}</pre>
</main>

<style>
  main {
    padding: 1rem;
  }

  pre {
    max-width: 100%;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 1rem;
    gap: 1rem;
  }
</style>
