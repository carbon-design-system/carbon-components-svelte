<script>
  import {
    AlluvialChart,
    AreaChart,
    BarChart,
    BoxplotChart,
    BulletChart,
    CalendarHeatmap,
    ChartAnomalies,
    ChartBand,
    ChoroplethChart,
    CirclePackChart,
    CohortTable,
    ComboChart,
    ComparisonBar,
    DeltaIndicator,
    DonutChart,
    DumbbellChart,
    EventTimeline,
    FlameGraph,
    FunnelBars,
    FunnelChart,
    FunnelCompare,
    Heatmap,
    HeatStrip,
    Histogram,
    IcicleChart,
    KpiCard,
    LineChart,
    LiveSparkline,
    LollipopChart,
    MicroDonut,
    MicroFunnel,
    MicroHistogram,
    RadarChart,
    RadialProgress,
    RangeIndicator,
    RankBars,
    RetentionChart,
    ScatterChart,
    ShareOfTotal,
    SmallMultiples,
    SpanWaterfall,
    Sparkline,
    StackedBar,
    StateTimeline,
    TileGridMap,
    TreeChart,
    TreemapChart,
    UptimeBar,
    VarianceIndicator,
    WaffleChart,
    WaterfallChart,
    WordCloudChart,
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

  const bundle = [
    { id: "bundle", parent: null, name: "bundle" },
    { id: "src", parent: "bundle", name: "src" },
    { id: "viz", parent: "src", name: "viz", bytes: 410 },
    { id: "core", parent: "src", name: "core", bytes: 230 },
    { id: "vendor", parent: "bundle", name: "vendor", bytes: 380 },
    { id: "assets", parent: "bundle", name: "assets" },
    { id: "css", parent: "assets", name: "css", bytes: 60 },
    { id: "img", parent: "assets", name: "img", bytes: 120 },
  ];

  const projectedFrom = new Date(2026, 8, 1);
  const projected = revenue
    .filter((row) => row.region === "EMEA")
    .map((row, i) => ({
      ...row,
      odd: i === 3,
      lo: i >= 8 ? row.revenue - (i - 7) * 2500 : null,
      hi: i >= 8 ? row.revenue + (i - 7) * 2500 : null,
    }));

  let selectedId = "activate";
</script>

<main data-testid="viz" style="padding: 1rem; max-width: 40rem">
  <h1>Data visualization</h1>

  <KpiCard
    label="Monthly revenue"
    value={1280000}
    delta={0.123}
    deltaLabel="vs last month"
  >
    <Sparkline slot="chart" {values} />
    <BulletChart
      slot="footer"
      value={1.28}
      target={1.5}
      max={2}
      size="sm"
      label="Against target"
    />
  </KpiCard>

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
    <MicroDonut data={stages} size="lg" label="Users by stage" />
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

  <EventTimeline
    data={[
      { at: new Date(2026, 0, 1, 1), type: "deploy", name: "v1.4.0" },
      { at: new Date(2026, 0, 1, 3), type: "alert", name: "Latency high" },
      { at: new Date(2026, 0, 1, 3, 20), type: "alert", name: "Error rate" },
      { at: new Date(2026, 0, 1, 4), type: "rollback", name: "v1.3.9" },
      { at: new Date(2026, 0, 1, 9), type: "deploy", name: "v1.4.1" },
    ]}
    at="at"
    kind="type"
    label="name"
    kinds={{ deploy: "info", alert: "warning", rollback: "error" }}
    title="Release events"
    selectable
  />

  <IcicleChart
    data={bundle}
    id="id"
    parent="parent"
    value="bytes"
    label="name"
    title="Bundle composition, as an icicle"
    selectable
  />

  <FlameGraph
    data={bundle}
    id="id"
    parent="parent"
    value="bytes"
    label="name"
    title="Bundle composition, as a flame graph"
  />

  <SpanWaterfall
    data={[
      { id: "gw", parent: null, name: "route", service: "gateway", start: 0, ms: 160 },
      { id: "api", parent: "gw", name: "GET /checkout", service: "api", start: 20, ms: 90 },
      { id: "db", parent: "api", name: "query orders", service: "db", start: 35, ms: 40 },
      { id: "auth", parent: "gw", name: "session", service: "auth", start: 22, ms: 28 },
      { id: "render", parent: "gw", name: "html", service: "api", start: 115, ms: 45 },
    ]}
    id="id"
    parent="parent"
    start="start"
    duration="ms"
    label="name"
    group="service"
    title="Checkout trace"
    selectable
  />

  <StateTimeline
    data={[
      { service: "api", status: "ok", from: new Date(2026, 0, 1, 0), to: new Date(2026, 0, 1, 6) },
      { service: "api", status: "down", from: new Date(2026, 0, 1, 6), to: new Date(2026, 0, 1, 7) },
      { service: "api", status: "ok", from: new Date(2026, 0, 1, 7), to: new Date(2026, 0, 1, 12) },
      { service: "worker", status: "degraded", from: new Date(2026, 0, 1, 0), to: new Date(2026, 0, 1, 12) },
    ]}
    row="service"
    state="status"
    start="from"
    end="to"
    states={{ ok: "success", down: "error", degraded: "warning" }}
    title="Service health"
    selectable
  />

  <VarianceIndicator
    value={-12000}
    max={30000}
    label="Revenue against plan"
    data-testid="variance"
  />

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

  <LiveSparkline
    seed={values}
    capacity={12}
    label="Requests per minute, streaming"
    data-testid="live-sparkline"
  />

  <FunnelCompare
    funnels={[
      { id: "organic", label: "Organic", stages },
      {
        id: "paid",
        label: "Paid",
        stages: stages.map((stage, i) => ({ ...stage, value: Math.round(stage.value * [0.8, 0.5, 0.4, 0.7][i]) })),
      },
    ]}
    label="Signup funnel by channel"
    selectable
  />

  <WaffleChart
    data={stages}
    selectable
    label="Users by stage, as cells"
    data-testid="waffle"
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

  <BarChart
    data={stages}
    x="label"
    y="value"
    title="Users by stage"
    orientation="horizontal"
    height={220}
  />

  <Heatmap
    data={revenue.filter((row) => row.date.getMonth() < 6)}
    x={(row) => row.date.toLocaleDateString("en-US", { month: "short" })}
    y="region"
    value="revenue"
    title="Revenue by region and month"
    rowHeader="Region"
    cellLabels
    selectable
  />

  <FunnelChart {stages} title="Signup funnel, tapered" rate="both" selectable />

  <CohortTable
    rows={[
      { id: "jan", label: "Jan", size: 1204, values: [1, 0.62, 0.48, 0.12] },
      { id: "feb", label: "Feb", size: 1530, values: [1, 0.58, 0.44] },
      { id: "mar", label: "Mar", size: 1377, values: [1, 0.65] },
    ]}
    title="Retention by signup month"
    summary="average"
    selectable
  />

  <CalendarHeatmap
    data={revenue}
    date="date"
    value="revenue"
    year={2026}
    title="Revenue by day"
    selectable
  />

  <Histogram
    data={revenue}
    x="revenue"
    bins={8}
    markers={[{ x: 40000, label: "Goal" }]}
    title="Distribution of monthly revenue"
    height={220}
  />

  <DumbbellChart
    data={revenue.filter((row) => [0, 5].includes(row.date.getMonth()))}
    x="region"
    y="revenue"
    series={(row) => (row.date.getMonth() === 0 ? "Jan" : "Jun")}
    title="January to June, by region"
    height={220}
  />

  <WaterfallChart
    data={[
      { step: "Visitors", change: 10000 },
      { step: "Bounced", change: -4000 },
      { step: "Left", change: -5100 },
      { step: "Paid", change: 0 },
    ]}
    x="step"
    y="change"
    totals={["Paid"]}
    title="Visitors to paid, as a waterfall"
    height={220}
  />

  <WordCloudChart
    data={stages}
    word="label"
    value="value"
    title="Stages as words"
    height={200}
  />

  <TileGridMap
    data={[
      { state: "CA", signups: 900 },
      { state: "TX", signups: 640 },
      { state: "NY", signups: 480 },
      { state: "WA", signups: 210 },
      { state: "FL", signups: 330 },
    ]}
    region="state"
    value="signups"
    title="Signups by state, as tiles"
    selectable
  />

  <ChoroplethChart
    features={["EMEA", "APAC", "AMER"].map((name, i) => ({
      id: name,
      properties: { name },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [i * 12, 40],
            [i * 12 + 10, 42],
            [i * 12 + 11, 33],
            [i * 12 + 1, 32],
            [i * 12, 40],
          ],
        ],
      },
    }))}
    data={revenue}
    region="region"
    value="revenue"
    title="Totals on a map"
    height={200}
  />

  <TreeChart
    data={[
      { id: "all", parent: null },
      ...stages.map((stage) => ({ id: stage.label, parent: "all" })),
      { id: "Trial", parent: "Activated" },
    ]}
    id="id"
    parent="parent"
    title="Stages as a tree"
    height={240}
  />

  <CirclePackChart
    data={revenue.filter((row) => row.date.getMonth() < 4)}
    value="revenue"
    label={(row) => row.date.toLocaleDateString("en-US", { month: "short" })}
    group="region"
    title="Monthly totals per region, packed"
    size={320}
  />

  <AlluvialChart
    data={[
      { from: "Visitors", to: "Signup", users: 6000 },
      { from: "Visitors", to: "Left", users: 4000 },
      { from: "Signup", to: "Paid", users: 900 },
      { from: "Signup", to: "Left", users: 5100 },
    ]}
    source="from"
    target="to"
    value="users"
    title="Signup flow"
    height={240}
  />

  <RadarChart
    data={revenue.filter((row) => row.date.getMonth() < 6)}
    axis={(row) => row.date.toLocaleDateString("en-US", { month: "short" })}
    value="revenue"
    series="region"
    title="Revenue by month, as a radar"
  />

  <TreemapChart
    data={revenue}
    value="revenue"
    label={(row) => row.date.toLocaleDateString("en-US", { month: "short" })}
    group="region"
    title="Revenue by region and month"
    selectable
  />

  <ComboChart
    data={[
      ...stages.map((stage) => ({ ...stage, metric: "Users" })),
      ...stages.map((stage) => ({
        ...stage,
        metric: "Share",
        value: stage.value / 10000,
      })),
    ]}
    x="label"
    y="value"
    series="metric"
    bars={["Users"]}
    lines={["Share"]}
    secondary={["Share"]}
    y2Format={{ style: "percent" }}
    title="Users and share by stage"
    height={240}
  />

  <BoxplotChart
    data={revenue}
    x="region"
    y="revenue"
    title="Spread of monthly totals per region"
    height={240}
  />

  <LollipopChart
    data={stages}
    x="label"
    y="value"
    title="Users by stage, as lollipops"
    height={220}
  />

  <ScatterChart
    data={revenue}
    x={(row) => row.date.getMonth() + 1}
    y="revenue"
    series="region"
    size="revenue"
    title="Revenue by month, as bubbles"
    xTitle="Month"
    height={240}
  />

  <DonutChart
    data={stages}
    value="value"
    category="label"
    title="Users by stage, as a donut"
    selectable
  />

  <LineChart
    data={revenue}
    x="date"
    y="revenue"
    series="region"
    title="Revenue by region"
    yTitle="Revenue"
    toolbar
    zoomBar
  />

  <RetentionChart
    data={["Jan", "Feb", "Mar"].flatMap((cohort, c) =>
      [0, 7, 14, 30].map((day, i) => ({
        cohort,
        day,
        retained: [1, 0.62 - c * 0.04, 0.48 - c * 0.03, 0.41 - c * 0.02][i],
      })),
    )}
    x="day"
    y="retained"
    series="cohort"
    baseline={0.35}
    title="Retention by signup cohort"
  />

  <SmallMultiples
    data={revenue}
    facet="region"
    x="date"
    y="revenue"
    title="Regions side by side"
    let:facet
    let:rows
    let:yDomain
    let:xDomain
    let:syncId
  >
    <LineChart
      data={rows}
      x="date"
      y="revenue"
      title={facet}
      {yDomain}
      {xDomain}
      {syncId}
      height={160}
      legend={false}
    />
  </SmallMultiples>

  <LineChart
    data={projected}
    x="date"
    y="revenue"
    series="region"
    title="Revenue, projected"
    forecastFrom={projectedFrom}
    forecastLabel="Today"
  >
    <ChartBand lower="lo" upper="hi" />
    <ChartAnomalies when="odd" />
  </LineChart>
</main>
