<script>
  import { TimeRangePicker } from "carbon-components-svelte";

  export let open = false;

  // `?now=` pins the clock, `?tz=` the zone and `?intervals=` the refresh
  // choices, so a run reads the same everywhere. Without them the fixture
  // runs on the real clock.
  const params = new URLSearchParams(location.search);
  const now = params.get("now") ?? undefined;
  const fixedZone = params.get("tz") ?? undefined;
  const intervals = params.get("intervals")?.split(",").map(Number);
  const zones = params.get("zones")?.split(",");
  const from = params.get("from");
  const to = params.get("to");

  let value = { from: from ?? "now-15m", to: to ?? "now" };
  let timeZone = fixedZone;
  let refreshInterval = 0;
  let changes = 0;
  let refreshes = 0;
  let last = "";
</script>

<main>
  <h1 class="bx--type-productive-heading-03">Checkout latency</h1>
  <TimeRangePicker
    {now}
    stepping
    refresh="auto"
    refreshIntervals={intervals}
    timeZones={zones}
    max="now"
    bind:value
    bind:timeZone
    bind:refreshInterval
    bind:open
    on:change={({ detail }) => {
      changes += 1;
      last = `${detail.trigger} ${detail.start.toISOString()} ${detail.end.toISOString()}`;
    }}
    on:refresh={() => (refreshes += 1)}
  />
  <p data-testid="value">{value.from}..{value.to}</p>
  <p data-testid="zone">{timeZone}</p>
  <p data-testid="interval">{refreshInterval}</p>
  <p data-testid="changes">{changes}</p>
  <p data-testid="refreshes">{refreshes}</p>
  <p data-testid="last">{last}</p>
</main>
