<script>
  import {
    BarChart,
    Chart,
    ChartAxis,
    ChartCrosshair,
    ChartGrid,
    ChartLine,
    LineChart,
    ParetoChart,
    ScatterChart,
    StatusGrid,
    TreemapChart,
  } from "carbon-components-svelte/viz";

  const DAY = 86_400_000;
  const start = new Date(2026, 7, 1).getTime();
  const revenue = ["EMEA", "APAC", "AMER"].flatMap((region, r) =>
    Array.from({ length: 60 }, (_, i) => ({
      date: new Date(start + i * DAY),
      region,
      revenue: 30 + r * 12 + Math.round(Math.sin(i / 5 + r) * 10) + i * 0.4,
    })),
  );
  const quarters = ["EMEA", "APAC", "AMER"].flatMap((region, r) =>
    ["Q1", "Q2", "Q3", "Q4"].map((quarter, i) => ({
      quarter,
      region,
      revenue: 40 + r * 15 + i * 6 + ((i * 7 + r * 3) % 9),
    })),
  );
  const cities = [
    { city: "Oslo", gdp: 92, pop: 0.7, tier: "A" },
    { city: "Lisbon", gdp: 38, pop: 0.5, tier: "B" },
    { city: "Berlin", gdp: 45, pop: 3.7, tier: "B" },
    { city: "Madrid", gdp: 41, pop: 3.3, tier: "C" },
    { city: "Dublin", gdp: 110, pop: 0.6, tier: "A" },
    { city: "Zurich", gdp: 120, pop: 0.4, tier: "A" },
  ];
  const tickets = [
    { cause: "Timeout", count: 120 },
    { cause: "Crash on save", count: 310 },
    { cause: "Login loop", count: 240 },
    { cause: "Typo", count: 35 },
    { cause: "Slow search", count: 90 },
    { cause: "Export fails", count: 60 },
  ];
  const STATES = [
    "healthy",
    "healthy",
    "healthy",
    "degraded",
    "healthy",
    "failed",
    "pending",
  ];
  const pods = Array.from({ length: 120 }, (_, i) => ({
    name: `pod-${i}`,
    state: STATES[(i * 5) % STATES.length],
  }));
  const spend = [
    { team: "Platform", service: "compute", cost: 41 },
    { team: "Platform", service: "storage", cost: 18 },
    { team: "Data", service: "warehouse", cost: 28 },
    { team: "Data", service: "streaming", cost: 12 },
  ];
  let brush = null;
</script>

<div style="width: 760px; padding: 16px; display: grid; gap: 24px">
  <BarChart
    data={quarters}
    x="quarter"
    y="revenue"
    series="region"
    title="Linked: click a bar"
    syncId="pair"
    sync={["hover", "selection"]}
    height={220}
    patterns="auto"
  />
  <LineChart
    data={quarters}
    x="quarter"
    y="revenue"
    series="region"
    title="Linked: the line follows"
    syncId="pair"
    sync={["hover", "selection"]}
    height={220}
    legendPosition="top"
  />
  <LineChart
    data={revenue}
    x="date"
    y="revenue"
    series="region"
    title="Compare, brush, legend right"
    compare={{ period: 30 * DAY }}
    brushable
    bind:brush
    legendPosition="right"
    height={240}
  />
  <Chart
    data={revenue}
    x="date"
    y="revenue"
    series="region"
    title="Crosshair"
    height={220}
  >
    <ChartGrid />
    <ChartAxis position="bottom" />
    <ChartAxis position="left" />
    <ChartLine />
    <ChartCrosshair />
  </Chart>
  <ScatterChart
    data={cities}
    x="pop"
    y="gdp"
    series="tier"
    title="Symbols and labels"
    symbols="auto"
    labels="auto"
    label="city"
    height={240}
  />
  <ParetoChart
    data={tickets}
    x="cause"
    y="count"
    title="Pareto"
    valueLabel="Tickets"
    height={240}
  />
  <StatusGrid data={pods} id="name" status="state" title="Status grid" />
  <TreemapChart
    data={spend}
    value="cost"
    label="service"
    group="team"
    title="Treemap, drilled"
    root="Platform"
    upLabel="All teams"
  />
  <LineChart
    data={[]}
    x="date"
    y="revenue"
    title="Error state"
    error
    asOf={new Date(2026, 9, 24, 9, 41)}
    height={160}
  />
</div>
