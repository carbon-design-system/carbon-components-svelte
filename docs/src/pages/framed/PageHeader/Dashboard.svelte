<script>
  import {
    BigNumber,
    Column,
    MenuButton,
    MenuItem,
    MenuItemRadioGroup,
    PageHeader,
    Row,
    Tab,
    TabContent,
    Tabs,
    Tile,
  } from "carbon-components-svelte";

  const timeRanges = [
    { id: "24h", text: "Last 24 hours" },
    { id: "7d", text: "Last 7 days" },
    { id: "30d", text: "Last 30 days" },
  ];

  let timeRange = "7d";

  $: timeRangeLabel = timeRanges.find((range) => range.id === timeRange)?.text;

  const metrics = [
    { label: "Requests", value: 1284000 },
    { label: "Error rate", value: 0.4, percentage: true },
    { label: "p95 latency (ms)", value: 182 },
    { label: "Active users", value: 9312 },
  ];
</script>

<PageHeader grid fill="layer-01" title="Usage" subtitle="All services">
  <svelte:fragment slot="tabs">
    <Tabs>
      <Tab label="Overview" />
      <Tab label="By service" />
    </Tabs>
  </svelte:fragment>
  <svelte:fragment slot="tabsEnd">
    <MenuButton kind="ghost" intrinsicAlign="end" labelText={timeRangeLabel}>
      <MenuItemRadioGroup labelText="Time range" bind:selectedId={timeRange}>
        {#each timeRanges as range (range.id)}
          <MenuItem id={range.id} labelText={range.text} />
        {/each}
      </MenuItemRadioGroup>
    </MenuButton>
  </svelte:fragment>
  <TabContent>
    <Row padding>
      {#each metrics as metric (metric.label)}
        <Column sm={2} md={4} lg={4}>
          <Tile>
            <BigNumber
              labelText={metric.label}
              value={metric.value}
              percentage={metric.percentage}
            />
          </Tile>
        </Column>
      {/each}
    </Row>
  </TabContent>
  <TabContent>
    <Row padding>
      <Column>Per-service breakdown.</Column>
    </Row>
  </TabContent>
</PageHeader>
