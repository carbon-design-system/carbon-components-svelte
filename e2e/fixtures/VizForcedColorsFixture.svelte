<script>
  import {
    BarChart,
    DonutChart,
    GanttChart,
    Heatmap,
    LineChart,
    SequenceDiagram,
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
  const messages = [
    { from: "Browser", to: "API", label: "GET /items" },
    { from: "API", to: "Browser", label: "200 OK", kind: "return" },
  ];
</script>

<div style="width: 480px">
  <LineChart
    data={revenue}
    x="month"
    y="revenue"
    series="region"
    title="Line"
    height={200}
  />
  <BarChart
    data={revenue}
    x="month"
    y="revenue"
    series="region"
    title="Bar"
    height={200}
  />
  <LineChart
    data={revenue}
    x="month"
    y="revenue"
    series="region"
    title="Loading"
    height={200}
    loading
  />
  <DonutChart data={devices} value="sessions" category="device" title="Donut" />
  <TreemapChart
    data={spend}
    value="cost"
    label="service"
    group="team"
    title="Treemap"
  />
  <GanttChart
    data={tasks}
    id="id"
    label="name"
    group="stream"
    start="from"
    end="to"
    title="Gantt"
  />
  <Heatmap data={cells} x="day" y="block" value="requests" title="Heatmap" />
  <SequenceDiagram
    data={messages}
    from="from"
    to="to"
    label="label"
    kind="kind"
    title="Sequence"
  />
</div>
