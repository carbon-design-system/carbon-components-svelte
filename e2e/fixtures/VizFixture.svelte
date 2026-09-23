<script>
  import {
    AlluvialChart,
    AreaChart,
    BarChart,
    BoxplotChart,
    BulletChart,
    BumpChart,
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
    ForestPlot,
    FunnelBars,
    FunnelChart,
    FunnelCompare,
    GanttChart,
    Heatmap,
    HeatStrip,
    Histogram,
    HorizonChart,
    IcicleChart,
    KpiCard,
    LayeredGraph,
    LineChart,
    LiveSparkline,
    LollipopChart,
    MarimekkoChart,
    MicroDonut,
    MicroFunnel,
    MicroHistogram,
    OrgChart,
    ParallelCoordinates,
    RadarChart,
    RadialProgress,
    RangeIndicator,
    RankBars,
    RetentionChart,
    ScatterChart,
    SegmentedProgress,
    SequenceDiagram,
    ShareOfTotal,
    SlopeChart,
    SmallMultiples,
    SpanWaterfall,
    Sparkline,
    StackedBar,
    StateTimeline,
    SunburstChart,
    TileGridMap,
    TreeChart,
    TreemapChart,
    UpSetPlot,
    UptimeBar,
    VarianceIndicator,
    WaffleChart,
    WaterfallChart,
    WinLoss,
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

  <HorizonChart
    data={["web-1", "web-2", "db-1"].flatMap((host, h) =>
      Array.from({ length: 48 }, (_, i) => ({
        t: new Date(2026, 0, 1, 0, i * 30),
        host,
        cpu: 30 + h * 15 + Math.round(Math.sin(i / 4 + h) * 25) + ((i * 13) % 9),
      })),
    )}
    x="t"
    y="cpu"
    series="host"
    title="CPU by host"
  />

  <GanttChart
    data={[
      { id: "spec", name: "spec", stream: "Design", from: new Date(2026, 8, 1), to: new Date(2026, 8, 8), done: 1 },
      { id: "api", name: "checkout API", stream: "API", from: new Date(2026, 8, 8), to: new Date(2026, 8, 18), done: 0.5, after: "spec" },
      { id: "web", name: "storefront", stream: "Web", from: new Date(2026, 8, 14), to: new Date(2026, 8, 24), after: "api" },
    ]}
    id="id"
    label="name"
    group="stream"
    start="from"
    end="to"
    progress="done"
    dependsOn="after"
    today={new Date(2026, 8, 12)}
    title="Launch plan"
  />

  <SequenceDiagram
    data={[
      { from: "client", to: "api", msg: "POST /orders" },
      { from: "api", to: "db", msg: "INSERT order" },
      { from: "db", to: "api", msg: "row", kind: "return" },
      { from: "api", to: "client", msg: "201 Created", kind: "return" },
    ]}
    from="from"
    to="to"
    label="msg"
    kind="kind"
    title="Create an order"
  />

  <LayeredGraph
    data={[
      { id: "app", name: "app", tier: "edge", health: "success" },
      { id: "api", name: "api", tier: "services", health: "warning" },
      { id: "web", name: "web", tier: "edge", health: "success" },
      { id: "db", name: "postgres", tier: "data", health: "error" },
      { id: "auth", name: "auth", tier: "services", health: "success" },
    ]}
    links={[
      { source: "app", target: "api" },
      { source: "app", target: "web" },
      { source: "api", target: "db" },
      { source: "api", target: "auth" },
      { source: "web", target: "auth" },
    ]}
    id="id"
    label="name"
    lane="tier"
    group="tier"
    status="health"
    title="Service dependencies"
  />

  <SlopeChart
    data={[
      { survey: "2025", team: "Web", score: 62 },
      { survey: "2025", team: "Data", score: 71 },
      { survey: "2025", team: "Mobile", score: 44 },
      { survey: "2026", team: "Web", score: 78 },
      { survey: "2026", team: "Data", score: 65 },
      { survey: "2026", team: "Mobile", score: 61 },
    ]}
    x="survey"
    y="score"
    series="team"
    title="Engagement score by team, 2025 to 2026"
  />

  <MarimekkoChart
    data={[
      { segment: "Enterprise", vendor: "Acme", share: 60, size: 300 },
      { segment: "Enterprise", vendor: "Beta", share: 40, size: 300 },
      { segment: "Mid-market", vendor: "Acme", share: 25, size: 100 },
      { segment: "Mid-market", vendor: "Beta", share: 50, size: 100 },
      { segment: "Mid-market", vendor: "Ce", share: 25, size: 100 },
    ]}
    x="segment"
    xValue="size"
    y="share"
    series="vendor"
    title="Market map"
  />

  <ForestPlot
    data={[
      { study: "North", or: 1.12, lo: 0.91, hi: 1.38, n: 400 },
      { study: "South", or: 0.94, lo: 0.8, hi: 1.1, n: 900 },
      { study: "EU", or: 1.21, lo: 1.02, hi: 1.48, n: 300 },
    ]}
    label="study"
    estimate="or"
    lo="lo"
    hi="hi"
    weight="n"
    overall={{ estimate: 1.06, lo: 1.01, hi: 1.16 }}
    nullValue={1}
    format={{ maximumFractionDigits: 2 }}
    title="Odds ratio by region"
  />

  <BumpChart
    data={[
      { week: "W1", team: "Ada", rank: 1 },
      { week: "W1", team: "Bell", rank: 2 },
      { week: "W1", team: "Cray", rank: 3 },
      { week: "W2", team: "Ada", rank: 2 },
      { week: "W2", team: "Bell", rank: 1 },
      { week: "W2", team: "Cray", rank: 3 },
      { week: "W3", team: "Ada", rank: 3 },
      { week: "W3", team: "Bell", rank: 1 },
      { week: "W3", team: "Cray", rank: 2 },
    ]}
    x="week"
    rank="rank"
    series="team"
    title="League standings by week"
  />

  <OrgChart
    data={[
      { id: "vp", manager: null, name: "A. Rivera", title: "VP Engineering" },
      { id: "plat", manager: "vp", name: "K. Chen", title: "Director, Platform", team: "Platform" },
      { id: "prod", manager: "vp", name: "J. Patel", title: "Director, Product", team: "Product" },
      { id: "obs", manager: "plat", name: "M. Lee", title: "Observability", team: "Platform" },
      { id: "checkout", manager: "prod", name: "S. Ng", title: "Checkout", team: "Product" },
    ]}
    id="id"
    parent="manager"
    label="name"
    sublabel="title"
    group="team"
    collapsed={["plat"]}
    title="Engineering org"
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

  <SunburstChart
    data={bundle}
    id="id"
    parent="parent"
    value="bytes"
    label="name"
    title="Bundle composition, as a sunburst"
    diameter={240}
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

  <UpSetPlot
    sets={[
      { id: "ent", label: "Enterprise" },
      { id: "sso", label: "SSO" },
      { id: "audit", label: "Audit log" },
    ]}
    data={[
      { tags: ["ent", "sso", "audit"] },
      { tags: ["ent", "sso"] },
      { tags: ["ent", "sso"] },
      { tags: ["sso"] },
      { tags: ["ent", "audit"] },
    ]}
    membership="tags"
    title="Account flag combinations"
    selectable
  />

  <VarianceIndicator
    value={-12000}
    max={30000}
    label="Revenue against plan"
    data-testid="variance"
  />

  <WinLoss data={[1, 1, -1, 0, 1]} label="Last 5 experiments" showValue />

  <SegmentedProgress value={4} max={8} label="Onboarding" showValue />

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

  <ParallelCoordinates
    data={[
      { name: "m5.large", tier: "general", cpu: 2, mem: 8, io: 40, cost: 96 },
      { name: "m5.xlarge", tier: "general", cpu: 4, mem: 16, io: 60, cost: 192 },
      { name: "c5.xlarge", tier: "compute", cpu: 4, mem: 8, io: 55, cost: 170 },
      { name: "r5.xlarge", tier: "memory", cpu: 4, mem: 32, io: 50, cost: 252 },
      { name: "i3.large", tier: "storage", cpu: 2, mem: 15, io: 95, cost: 156 },
    ]}
    dimensions={["cpu", "mem", "io", "cost"]}
    series="tier"
    label="name"
    title="Instance profiles"
    brushes={{ cpu: [3, 5] }}
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
