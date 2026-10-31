<script>
  import {
    Column,
    Grid,
    InlineNotification,
    Layer,
    OverflowMenu,
    OverflowMenuItem,
    Row,
    Stack,
    Tile,
    Toggle,
  } from "carbon-components-svelte";
  import {
    BarChart,
    ChartColors,
    createDashboard,
    createTimeRange,
    DonutChart,
    FilterChips,
    filterRows,
    KpiCard,
    LineChart,
    StatusGrid,
    TimeRangePicker,
    withinRange,
  } from "carbon-components-svelte/viz";
  import { onMount } from "svelte";

  // One clock for the page, so a preset is reproducible here.
  const NOW = new Date(2026, 9, 24, 9, 41).getTime();
  const HOUR = 3_600_000;
  const REGIONS = ["EMEA", "APAC", "AMER"];
  const PRODUCTS = ["Cloud", "Data", "Security"];

  // The page's time range, and what the charts share beyond one channel.
  const range = createTimeRange({
    presets: ["24h", "7d", "30d"],
    initial: "7d",
    now: () => NOW,
  });
  const board = createDashboard({ range });

  // Thirty days of hourly revenue per region and product.
  const all = Array.from({ length: 30 * 24 }, (_, i) => {
    const time = new Date(NOW - (30 * 24 - i) * HOUR);
    return REGIONS.flatMap((region, r) =>
      PRODUCTS.map((product, p) => ({
        time,
        region,
        product,
        revenue: Math.round(
          900 +
            r * 300 +
            p * 150 +
            Math.sin(i / 17 + r + p) * 250 +
            ((i * 7919 * (r + 2) * (p + 1)) % 180),
        ),
      })),
    );
  }).flat();

  // Filters first, then the range, then whatever each chart groups by.
  $: inRange = withinRange(all, "time", $range);
  $: rows = filterRows(inRange, $board.filters);
  $: byRegion = REGIONS.map((region) => ({
    region,
    revenue: rows
      .filter((row) => row.region === region)
      .reduce((sum, row) => sum + row.revenue, 0),
  }));
  $: byProduct = PRODUCTS.map((product) => ({
    product,
    revenue: rows
      .filter((row) => row.product === product)
      .reduce((sum, row) => sum + row.revenue, 0),
  }));
  // A line wants one row per x and series: the products summed per hour.
  $: hourly = [
    ...rows
      .reduce((acc, row) => {
        const key = `${row.time.getTime()}|${row.region}`;
        const entry = acc.get(key);
        if (entry) entry.revenue += row.revenue;
        else
          acc.set(key, {
            time: row.time,
            region: row.region,
            revenue: row.revenue,
          });
        return acc;
      }, new Map())
      .values(),
  ];
  $: total = rows.reduce((sum, row) => sum + row.revenue, 0);
  $: hours = Math.max(1, ($range.to - $range.from) / HOUR);

  // Live: a sparkline of requests that keeps arriving.
  let live;
  let streaming = false;
  let requests = Array.from({ length: 40 }, (_, i) => ({
    time: new Date(NOW - (40 - i) * 60_000),
    requests: 400 + Math.round(Math.sin(i / 5) * 60),
  }));
  let tickAt = NOW;
  onMount(() => {
    const timer = setInterval(() => {
      if (!streaming) return;
      tickAt += 60_000;
      live?.push({
        time: new Date(tickAt),
        requests:
          400 +
          Math.round(Math.sin(tickAt / 300_000) * 60 + Math.random() * 30),
      });
    }, 500);
    return () => clearInterval(timer);
  });

  const pods = Array.from({ length: 120 }, (_, i) => ({
    name: `pod-${i + 1}`,
    state: ["healthy", "healthy", "healthy", "degraded", "healthy", "failed"][
      (i * 7) % 6
    ],
  }));
  let failing = false;
</script>

<ChartColors colors={{ EMEA: "cat-01", APAC: "cat-02", AMER: "cat-03" }}>
  <Layer withBackground>
    <Stack gap={5} style="padding: 1rem">
      <div
        style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center"
      >
        <TimeRangePicker {range} />
        <Toggle
          size="sm"
          labelText="Stream requests"
          bind:toggled={streaming}
        />
        <Toggle size="sm" labelText="Fail a source" bind:toggled={failing} />
      </div>
      <FilterChips
        {board}
        labels={{ region: "Region", product: "Product" }}
        emptyText="Click a bar or a slice to filter the page"
      />
      {#if failing}
        <InlineNotification
          kind="warning"
          lowContrast
          title="Degraded"
          subtitle="The sessions source did not respond; other tiles are current."
          hideCloseButton
        />
      {/if}
      <Grid narrow fullWidth>
        <Row>
          <Column sm={4} md={4} lg={4}>
            <KpiCard
              label="Revenue"
              subtitle="USD, net"
              value={total}
              format={{
                style: "currency",
                currency: "USD",
                notation: "compact",
              }}
              delta={0.071}
              deltaLabel="vs prior period"
              asOf={new Date(NOW)}
            />
          </Column>
          <Column sm={4} md={4} lg={4}>
            <KpiCard
              label="Revenue per hour"
              subtitle="Across the range"
              value={total / hours}
              format={{
                style: "currency",
                currency: "USD",
                notation: "compact",
              }}
              status={total / hours < 9000 ? "cautious" : "stable"}
              statusLabel={total / hours < 9000 ? "Below plan" : "On plan"}
            />
          </Column>
          <Column sm={4} md={4} lg={4}>
            <KpiCard
              label="Sessions"
              subtitle="Unique, last hour"
              value={48200}
              format={{ notation: "compact" }}
              error={failing}
              asOf={new Date(NOW - HOUR)}
            >
              <svelte:fragment slot="error"
                >Sessions source did not respond.
                <a
                  href="#retry"
                  on:click|preventDefault={() => (failing = false)}
                  >Retry</a
                ></svelte:fragment
              >
            </KpiCard>
          </Column>
          <Column sm={4} md={4} lg={4}>
            <KpiCard
              label="Pods"
              subtitle="Healthy of total"
              value={pods.filter((p) => p.state === "healthy").length /
                pods.length}
              format={{ style: "percent" }}
              positive="up"
              delta={-0.02}
              deltaLabel="vs yesterday"
            />
          </Column>
        </Row>
        <Row>
          <Column sm={4} md={8} lg={10}>
            <Tile>
              <LineChart
                grid={false}
                data={hourly}
                x="time"
                y="revenue"
                series="region"
                title="Revenue by region"
                subtitle="Hourly, USD"
                xDomain={[$range.from, $range.to]}
                syncId="board"
                sync={["hover", "zoom", "hidden"]}
                zoomable
                brushable
                zoomBar
                toolbar={{
                  filename: "revenue",
                  copy: true,
                  copyImage: true,
                  print: true,
                }}
                asOf={new Date(NOW)}
                aspectRatio={3}
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
                data={byProduct}
                value="revenue"
                category="product"
                title="Revenue by product"
                selectable
                on:select={(e) =>
                  board.toggleFilter("product", e.detail.slice.label)}
              />
            </Tile>
          </Column>
        </Row>
        <Row>
          <Column sm={4} md={8} lg={8}>
            <Tile>
              <BarChart
                grid={false}
                data={byRegion}
                x="region"
                y="revenue"
                title="Revenue by region"
                subtitle="Click a bar to filter"
                legend={false}
                height={220}
                on:select={(e) =>
                  board.toggleFilter("region", e.detail.datum.region)}
              />
            </Tile>
          </Column>
          <Column sm={4} md={8} lg={8}>
            <Tile>
              <LineChart
                grid={false}
                bind:this={live}
                data={requests}
                x="time"
                y="requests"
                title="Requests per minute"
                subtitle={streaming ? "Streaming" : "Paused"}
                maxRows={60}
                points="none"
                legend={false}
                height={220}
              />
            </Tile>
          </Column>
        </Row>
        <Row>
          <Column sm={4} md={8} lg={16}>
            <Tile>
              <StatusGrid
                data={pods}
                id="name"
                status="state"
                title="Pods by state"
              />
            </Tile>
          </Column>
        </Row>
      </Grid>
    </Stack>
  </Layer>
</ChartColors>
