<script>
  import {
    AreaChart,
    BarChart,
    BulletChart,
    ComparisonBar,
    DeltaIndicator,
    FunnelBars,
    HeatStrip,
    LineChart,
    MicroFunnel,
    MicroHistogram,
    RadialProgress,
    RangeIndicator,
    RankBars,
    ShareOfTotal,
    Sparkline,
    StackedBar,
    UptimeBar,
  } from "carbon-components-svelte/viz";

  const stages = [
    { id: "visit", label: "Visitors", value: 10000 },
    { id: "signup", label: "Signup", value: 6000 },
    { id: "activate", label: "Activated", value: 3000 },
    { id: "paid", label: "Paid", value: 900 },
  ];
  const values = [4, 7, 3, null, 5, 12, 8, 6, 10, 14, 9, 13];

  const revenue = ["EMEA", "APAC", "AMER"].flatMap((region, r) =>
    Array.from({ length: 12 }, (_, i) => ({
      date: new Date(2026, i, 1),
      region,
      revenue: 30000 + r * 9000 + Math.round(Math.sin(i / 2 + r) * 9000),
    })),
  );

  let selectedId = "activate";
</script>

<main data-testid="viz" style="padding: 1rem; max-width: 40rem">
  <h1>Data visualization</h1>

  <p>
    <DeltaIndicator value={0.123} format="percent" label="vs last week" />
    <DeltaIndicator value={-64} />
    <DeltaIndicator value={-320} positive="down" />
    <DeltaIndicator value={0} />
  </p>

  <p>
    <Sparkline {values} label="Requests per minute, last 24 hours" />
    <Sparkline {values} kind="bar" color={3} label="Errors per minute" />
    <Sparkline {values} color="success" fill label="Throughput" />
  </p>

  <p>
    <MicroFunnel {stages} label="Signup funnel" />
    <MicroFunnel {stages} variant="completion" label="Signup funnel" />
    <MicroHistogram {values} bins={6} marker={9} label="Requests per minute" />
  </p>

  <BulletChart
    value={270}
    target={300}
    max={400}
    bands={[150, 250]}
    showValue
    label="Revenue"
  />

  <p><ShareOfTotal value={380} total={1000} label="Enterprise share" /></p>

  <RangeIndicator
    min={12}
    max={480}
    value={92}
    quartiles={[40, 88, 140]}
    showRange
    label="Latency now"
  />

  <p>
    <RadialProgress
      value={86}
      thresholds={{ warning: 80, error: 95 }}
      arc="three-quarter"
      label="Disk usage"
    />
  </p>

  <p><HeatStrip {values} label="Requests by hour" /></p>

  <UptimeBar
    data={[
      { status: "ok", label: "Mon" },
      { status: "degraded", label: "Tue" },
      { status: "down", label: "Wed" },
      { status: "none", label: "Thu" },
    ]}
    selectable
    showValue
    label="API uptime"
  />

  <ComparisonBar value={1284} previous={912} showDelta label="Orders" />

  <RankBars data={stages} top={3} other label="Stages by users" />
  <RankBars data={stages} selectable label="Pick a ranked stage" />

  <StackedBar data={stages} labels="below" label="Users by stage" />
  <StackedBar
    data={stages}
    labels="below"
    selectable
    label="Pick a stage"
    data-testid="stacked-bar"
  />

  <FunnelBars
    {stages}
    label="Signup funnel, last 30 days"
    rate="both"
    showDrop
    highlight="largest-drop"
  />

  <FunnelBars
    {stages}
    label="Selectable signup funnel"
    rate="step"
    selectable
    bind:selectedId
    data-testid="selectable-funnel"
  />
  <output data-testid="selected">{selectedId}</output>

  <AreaChart
    data={revenue}
    x="date"
    y="revenue"
    series="region"
    title="Stacked revenue"
    stack="stacked"
  />

  <BarChart
    data={revenue.filter((row) => row.date.getMonth() < 4)}
    x="date"
    y="revenue"
    series="region"
    title="Revenue by month"
    mode="stacked"
  />

  <LineChart
    data={revenue}
    x="date"
    y="revenue"
    series="region"
    title="Revenue by region"
    yTitle="Revenue"
    toolbar
  />
</main>
