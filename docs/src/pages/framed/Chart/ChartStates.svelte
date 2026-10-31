<script>
  import { Button, Stack, Toggle } from "carbon-components-svelte";
  import {
    DonutChart,
    LineChart,
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
    { service: "Streaming", cost: 12, team: "Data" },
  ];

  let loading = false;
  let empty = false;
  let timer;

  function reload() {
    clearTimeout(timer);
    loading = true;
    timer = setTimeout(() => {
      loading = false;
    }, 1500);
  }
</script>

<Stack gap={6}>
  <Stack orientation="horizontal" gap={6} align="end" wrap="wrap">
    <Toggle labelText="Loading" size="sm" bind:toggled={loading} />
    <Toggle labelText="No data" size="sm" bind:toggled={empty} />
    <Button kind="tertiary" size="small" on:click={reload}>
      Reload for 1.5 s
    </Button>
  </Stack>

  <LineChart
    data={empty ? [] : revenue}
    x="month"
    y="revenue"
    series="region"
    title="Revenue by region"
    height={200}
    {loading}
    emptyText="No revenue in this period"
  />

  <DonutChart
    data={empty ? [] : devices}
    value="sessions"
    category="device"
    title="Sessions by device"
    {loading}
    emptyText="No sessions yet"
  />

  <TreemapChart
    data={empty ? [] : spend}
    value="cost"
    label="service"
    group="team"
    title="Cloud spend"
    {loading}
    emptyText="No spend recorded"
  />
</Stack>
