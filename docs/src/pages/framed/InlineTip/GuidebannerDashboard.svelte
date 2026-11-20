<script>
  import {
    BigNumber,
    Button,
    createTipStore,
    Guidebanner,
    localTipStorage,
    Stack,
    Tile,
  } from "carbon-components-svelte";

  const tips = createTipStore({
    storage: localTipStorage("docs:dashboard-tips"),
  });

  const guide = [
    {
      id: "dashboard-range",
      title: "Change the time range",
      text: "Pick the last hour, day or week from the menu above the charts.",
    },
    {
      id: "dashboard-alerts",
      title: "Alert on a metric",
      text: "Open a chart's menu and choose Create alert to get paged when it crosses a limit.",
      href: "#alerts",
    },
    {
      id: "dashboard-share",
      title: "Share a dashboard",
      text: "Copy a link that opens this dashboard with the same time range.",
      href: "#share",
    },
  ];

  let events = [];
</script>

<Stack gap={5}>
  <Guidebanner
    id="dashboard-guide"
    labelText="Dashboard tips"
    store={tips}
    tips={guide}
    on:change={({ detail }) => {
      events = [...events, { event: "on:change", detail }];
    }}
    on:dismiss={({ detail }) => {
      events = [...events, { event: "on:dismiss", detail }];
    }}
  />
  <Tile>
    <BigNumber
      labelText="Requests (24h)"
      value={1843200}
      size="lg"
      trend="up"
    />
  </Tile>
  <Button kind="tertiary" size="small" on:click={() => tips.reset()}>
    Show tips again
  </Button>
  <pre>{JSON.stringify(events, null, 2)}</pre>
</Stack>
