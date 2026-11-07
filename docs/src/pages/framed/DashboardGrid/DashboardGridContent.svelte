<script>
  import {
    Button,
    DashboardGrid,
    DashboardGridItem,
    DataTable,
    Layer,
    TextInput,
  } from "carbon-components-svelte";

  let layout = [
    { id: "filter", x: 0, y: 0, w: 5, h: 2 },
    { id: "services", x: 5, y: 0, w: 7, h: 4 },
  ];
  let clicks = 0;
  let value = "";

  const headers = [
    { key: "name", value: "Name" },
    { key: "region", value: "Region" },
  ];
  const rows = Array.from({ length: 10 }, (_, n) => ({
    id: String(n),
    name: `Service ${n + 1}`,
    region: n % 2 ? "us-south" : "eu-de",
  }));
</script>

<Layer withBackground>
  <DashboardGrid bind:layout cols={12} rowHeight={64} aria-label="Content">
    <DashboardGridItem id="filter" titleText="Filter">
      <TextInput size="sm" labelText="Name" bind:value />
      <Button size="small" on:click={() => (clicks += 1)}>
        Pressed {clicks} times
      </Button>
    </DashboardGridItem>
    <DashboardGridItem id="services" titleText="Services" noPadding>
      <DataTable size="short" sortable {headers} {rows} />
    </DashboardGridItem>
  </DashboardGrid>
</Layer>
