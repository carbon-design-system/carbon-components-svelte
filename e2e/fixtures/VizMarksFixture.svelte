<script>
  import {
    BarChart,
    Chart,
    ChartAnnotations,
    ChartAxis,
    ChartBars,
    ChartErrorBars,
    ChartGrid,
    ChartLine,
    LineChart,
    ScatterChart,
  } from "carbon-components-svelte/viz";

  const revenue = ["EMEA", "APAC", "AMER"].flatMap((region, r) =>
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, i) => ({
      month,
      region,
      revenue: 30 + r * 12 + Math.round(Math.sin(i + r) * 10) + i * 3,
      lo: 25 + r * 12 + Math.round(Math.sin(i + r) * 10) + i * 3,
      hi: 36 + r * 12 + Math.round(Math.sin(i + r) * 10) + i * 3,
    })),
  );
  const cities = [
    { city: "Oslo", gdp: 92, pop: 0.7 },
    { city: "Lisbon", gdp: 38, pop: 0.5 },
    { city: "Berlin", gdp: 45, pop: 3.7 },
    { city: "Madrid", gdp: 41, pop: 3.3 },
    { city: "Dublin", gdp: 110, pop: 0.6 },
    { city: "Zurich", gdp: 120, pop: 0.4 },
  ];
</script>

<div style="width: 720px; padding: 16px; display: grid; gap: 24px">
  <BarChart
    data={revenue}
    x="month"
    y="revenue"
    series="region"
    title="Bars, labels outside"
    labels="outside"
    height={240}
  />
  <BarChart
    data={revenue}
    x="month"
    y="revenue"
    series="region"
    title="Stacked, totals"
    mode="stacked"
    labels="outside"
    height={240}
  />
  <Chart
    data={revenue}
    x="month"
    y="revenue"
    series="region"
    title="Error bars on grouped bars"
    height={240}
  >
    <ChartGrid />
    <ChartAxis position="bottom" />
    <ChartAxis position="left" />
    <ChartBars />
    <ChartErrorBars lo="lo" hi="hi" bars={{}} />
  </Chart>
  <LineChart
    data={revenue}
    x="month"
    y="revenue"
    series="region"
    title="Line, end labels"
    labels="end"
    legend={false}
    height={240}
  />
  <Chart
    data={revenue}
    x="month"
    y="revenue"
    series="region"
    title="Annotations"
    height={260}
  >
    <ChartGrid />
    <ChartAxis position="bottom" />
    <ChartAxis position="left" />
    <ChartLine />
    <ChartAnnotations
      items={[
        { x: "Mar", label: "Pricing change", kind: "info" },
        { x: "May", y: 52, label: "Outage", kind: "error" },
        { x: "Jun", y: 84, label: "Record" },
      ]}
    />
  </Chart>
  <ScatterChart
    data={cities}
    x="pop"
    y="gdp"
    title="Scatter, auto labels"
    labels="auto"
    label="city"
    height={260}
    legend={false}
  />
</div>
