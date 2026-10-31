<script>
  import {
    DonutChart,
    GanttChart,
    Heatmap,
    LayeredGraph,
    LineChart,
    SunburstChart,
    TreemapChart,
  } from "carbon-components-svelte/viz";

  const revenue = ["EMEA", "APAC", "AMER"].flatMap((region, r) =>
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, i) => ({
      month,
      region,
      revenue: 30 + r * 12 + Math.round(Math.sin(i + r) * 10) + i * 3,
    })),
  );
  const devices = [
    { device: "Desktop", sessions: 5200 },
    { device: "Mobile", sessions: 3100 },
    { device: "Tablet", sessions: 1100 },
  ];
  const spend = [
    { service: "Compute", cost: 41, team: "Platform" },
    { service: "Storage", cost: 18, team: "Platform" },
    { service: "Warehouse", cost: 28, team: "Data" },
  ];
  const tasks = [
    {
      id: "a",
      name: "Spec",
      stream: "Design",
      from: new Date(2026, 8, 1),
      to: new Date(2026, 8, 8),
    },
    {
      id: "b",
      name: "Build",
      stream: "API",
      from: new Date(2026, 8, 6),
      to: new Date(2026, 8, 20),
    },
  ];
  const cells = ["Mon", "Tue"].flatMap((day) =>
    ["00", "08", "16"].map((block) => ({
      day,
      block,
      requests: day.length * block.length,
    })),
  );
  const tree = [
    { id: "root", parent: null, name: "Root", value: 0 },
    { id: "a", parent: "root", name: "A", value: 40 },
    { id: "b", parent: "root", name: "B", value: 30 },
  ];
  const nodes = [
    { id: "cdn" },
    { id: "web", group: "apps" },
    { id: "db", group: "data" },
  ];
  const links = [
    { source: "cdn", target: "web" },
    { source: "web", target: "db" },
  ];

  const states = [
    { key: "data", loading: false, empty: false },
    { key: "loading", loading: true, empty: false },
    { key: "empty", loading: false, empty: true },
  ];
</script>

<!-- Every chart in its three states, side by side, so a test can assert the
     boxes share one size. -->
<div class="matrix">
  {#each states as state (state.key)}
    <div class="column" data-state={state.key}>
      <LineChart
        data={state.empty ? [] : revenue}
        x="month"
        y="revenue"
        series="region"
        title="Line"
        height={200}
        loading={state.loading}
      />
      <DonutChart
        data={state.empty ? [] : devices}
        value="sessions"
        category="device"
        title="Donut"
        loading={state.loading}
      />
      <TreemapChart
        data={state.empty ? [] : spend}
        value="cost"
        label="service"
        group="team"
        title="Treemap"
        loading={state.loading}
      />
      <GanttChart
        data={state.empty ? [] : tasks}
        id="id"
        label="name"
        group="stream"
        start="from"
        end="to"
        title="Gantt"
        loading={state.loading}
      />
      <Heatmap
        data={state.empty ? [] : cells}
        x="day"
        y="block"
        value="requests"
        title="Heatmap"
        loading={state.loading}
      />
      <SunburstChart
        data={state.empty ? [] : tree}
        id="id"
        parent="parent"
        value="value"
        label="name"
        title="Sunburst"
        loading={state.loading}
      />
      <LayeredGraph
        nodes={state.empty ? [] : nodes}
        {links}
        id="id"
        label="id"
        group="group"
        title="Graph"
        loading={state.loading}
      />
    </div>
  {/each}
</div>

<style>
  .matrix {
    display: grid;
    grid-template-columns: repeat(3, 480px);
    gap: 2rem;
    padding: 1rem;
  }
  .column {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
