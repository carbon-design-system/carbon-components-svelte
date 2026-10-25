<script>
  import {
    Box,
    Column,
    DataTable,
    Grid,
    Layer,
    OverflowMenu,
    OverflowMenuItem,
    Row,
    Tile,
  } from "carbon-components-svelte";
  import {
    DeltaIndicator,
    DonutChart,
    KpiCard,
    LineChart,
    Sparkline,
  } from "carbon-components-svelte/viz";

  const DAY = 86_400_000;
  const START = new Date(2026, 8, 1).getTime();
  const revenue = ["EMEA", "APAC", "AMER"].flatMap((region, r) =>
    Array.from({ length: 30 }, (_, i) => ({
      date: new Date(START + i * DAY),
      region,
      revenue: Math.round(
        30000 + r * 9000 + Math.sin(i / 4 + r) * 6000 + ((i * 7919) % 2500),
      ),
    })),
  );
  // A brush on the revenue line narrows the revenue KPI to that range.
  let range = null;
  $: inRange = range
    ? revenue.filter((row) => row.date >= range[0] && row.date <= range[1])
    : revenue;
  $: revenueTotal = inRange.reduce((sum, row) => sum + row.revenue, 0);
  $: revenueLabel = range ? "Revenue, brushed range" : "Revenue, 30 days";
  const devices = [
    { device: "Desktop", sessions: 52000 },
    { device: "Mobile", sessions: 31000 },
    { device: "Tablet", sessions: 11000 },
    { device: "TV", sessions: 4000 },
  ];
  const services = [
    {
      id: "api",
      name: "API gateway",
      p95: 182,
      delta: -0.12,
      trend: [220, 210, 205, 198, 190, 184, 182],
    },
    {
      id: "auth",
      name: "Auth",
      p95: 96,
      delta: 0.04,
      trend: [90, 92, 91, 95, 94, 97, 96],
    },
    {
      id: "search",
      name: "Search",
      p95: 340,
      delta: 0.19,
      trend: [280, 290, 300, 310, 322, 335, 340],
    },
    {
      id: "checkout",
      name: "Checkout",
      p95: 240,
      delta: -0.03,
      trend: [250, 248, 246, 244, 242, 241, 240],
    },
  ];
</script>

<!-- A page section as an app would lay it out: a row of KPI tiles, two
     charts on tiles, and a table with inline graphics, all on one layer. -->
<Layer withBackground>
  <Box padding={5}>
    <Grid narrow fullWidth>
      <Row>
        <Column sm={4} md={4} lg={4}>
          <KpiCard
            label={revenueLabel}
            value={revenueTotal}
            format={{ style: "currency", currency: "USD", notation: "compact" }}
            delta={0.123}
            deltaLabel="vs prior 30 days"
          />
        </Column>
        <Column sm={4} md={4} lg={4}>
          <KpiCard
            label="Sessions"
            value={98000}
            format={{ notation: "compact" }}
            delta={0.058}
            deltaLabel="vs prior 30 days"
          />
        </Column>
        <Column sm={4} md={4} lg={4}>
          <KpiCard
            label="p95 latency"
            subtitle="API gateway"
            value={214}
            format={(v) => `${v} ms`}
            delta={0.04}
            deltaLabel="vs last week"
            positive="down"
            status="cautious"
            statusLabel="Over target"
          />
        </Column>
        <Column sm={4} md={4} lg={4}>
          <KpiCard
            label="Error rate"
            value={0.0041}
            format={{ style: "percent", maximumFractionDigits: 2 }}
            delta={-0.21}
            deltaLabel="vs last week"
            positive="down"
          />
        </Column>
      </Row>
      <Row>
        <Column sm={4} md={8} lg={10}>
          <Tile>
            <LineChart
              data={revenue}
              x="date"
              y="revenue"
              series="region"
              title="Revenue by region"
              subtitle="USD, net of refunds"
              asOf={new Date(2026, 8, 30, 9, 41)}
              height={240}
              brushable
              bind:brush={range}
            >
              <OverflowMenu
                slot="actions"
                flipped
                size="sm"
                aria-label="Chart options"
              >
                <OverflowMenuItem text="Open report" />
                <OverflowMenuItem text="Set alert" />
              </OverflowMenu>
            </LineChart>
          </Tile>
        </Column>
        <Column sm={4} md={8} lg={6}>
          <Tile>
            <DonutChart
              data={devices}
              value="sessions"
              category="device"
              title="Sessions by device"
              diameter={160}
            />
          </Tile>
        </Column>
      </Row>
      <Row>
        <Column sm={4} md={8} lg={16}>
          <Tile>
            <DataTable
              title="Service latency"
              description="p95 over the last seven days"
              size="medium"
              headers={[
                { key: "name", value: "Service" },
                { key: "p95", value: "p95 (ms)" },
                { key: "delta", value: "Change" },
                { key: "trend", value: "Trend" },
              ]}
              rows={services}
            >
              <svelte:fragment slot="cell" let:cell>
                {#if cell.key === "delta"}
                  <DeltaIndicator
                    value={cell.value}
                    format="percent"
                    positive="down"
                    size="sm"
                  />
                {:else if cell.key === "trend"}
                  <Sparkline
                    values={cell.value}
                    label="p95 trend"
                    width={96}
                    height={20}
                  />
                {:else}
                  {cell.value}
                {/if}
              </svelte:fragment>
            </DataTable>
          </Tile>
        </Column>
      </Row>
    </Grid>
  </Box>
</Layer>
