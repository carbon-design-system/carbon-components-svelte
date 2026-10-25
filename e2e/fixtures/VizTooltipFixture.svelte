<script>
  import {
    BarChart,
    LineChart,
    TileGridMap,
  } from "carbon-components-svelte/viz";

  const signups = [
    { state: "CA", signups: 900 },
    { state: "UT", signups: 120 },
    { state: "TX", signups: 640 },
    { state: "NY", signups: 480 },
    { state: "WA", signups: 210 },
    { state: "FL", signups: 330 },
  ];
  const revenue = ["EMEA", "APAC", "AMER"].flatMap((region, r) =>
    ["Jan", "Feb", "Mar", "Apr"].map((month, i) => ({
      month,
      region,
      revenue: 30 + r * 12 + i * 3,
    })),
  );
</script>

<div style="width: 640px; padding: 16px">
  <TileGridMap data={signups} region="state" value="signups" title="Tiles" />
  <BarChart
    data={revenue}
    x="month"
    y="revenue"
    series="region"
    title="Bars"
    height={200}
  />
  <LineChart
    data={revenue}
    x="month"
    y="revenue"
    series="region"
    title="Synced A"
    height={160}
    syncId="pair"
  />
  <LineChart
    data={revenue}
    x="month"
    y="revenue"
    series="region"
    title="Synced B"
    height={160}
    syncId="pair"
  />
</div>
