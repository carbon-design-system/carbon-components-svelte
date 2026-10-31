<script>
  import {
    BarChart,
    DonutChart,
    GanttChart,
    LineChart,
    TreemapChart,
  } from "carbon-components-svelte/viz";

  const SERIES = Array.from({ length: 14 }, (_, i) => `Series ${i + 1}`);
  const revenue = SERIES.flatMap((region, r) =>
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, i) => ({
      month,
      region,
      revenue: 30 + r * 4 + Math.round(Math.sin(i + r) * 10) + i * 3,
    })),
  );
  const devices = [
    { device: "Desktop", sessions: 5200 },
    { device: "Mobile", sessions: 3100 },
    { device: "Tablet", sessions: 1100 },
  ];
  const spend = Array.from({ length: 12 }, (_, i) => ({
    service: `Service ${i + 1}`,
    cost: 40 - i * 2,
    team: `Team ${(i % 10) + 1}`,
  }));
  const regions = [
    "North America and the Caribbean",
    "Europe",
    "Asia Pacific",
  ].map((region, i) => ({ region, units: 12_000 + i * 7_300 }));
  const tasks = [
    {
      id: "a",
      name: "Specification of the launch",
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
</script>

<!-- The same charts in boxes from a phone column to a card, so a test can
     assert nothing spills and legends fold. -->
{#each [240, 320, 390, 480] as width (width)}
  <div data-testid="box-{width}" style="width: {width}px; margin: 1rem;">
    <LineChart
      data={revenue}
      x="month"
      y="revenue"
      series="region"
      title="Line"
      height={160}
    />
    <DonutChart
      data={devices}
      value="sessions"
      category="device"
      title="Donut"
    />
    <TreemapChart
      data={spend}
      value="cost"
      label="service"
      group="team"
      title="Treemap"
    />
    <BarChart
      data={regions}
      x="region"
      y="units"
      orientation="horizontal"
      title="Bars"
      height={160}
    />
    <BarChart
      data={regions}
      x="region"
      y="units"
      title="Columns"
      height={160}
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
  </div>
{/each}
