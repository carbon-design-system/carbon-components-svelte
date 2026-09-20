<script>
  import {
    DeltaIndicator,
    FunnelBars,
    MicroFunnel,
    Sparkline,
  } from "carbon-components-svelte/viz";

  const stages = [
    { id: "visit", label: "Visitors", value: 10000 },
    { id: "signup", label: "Signup", value: 6000 },
    { id: "activate", label: "Activated", value: 3000 },
    { id: "paid", label: "Paid", value: 900 },
  ];
  const values = [4, 7, 3, null, 5, 12, 8, 6, 10, 14, 9, 13];

  let selectedId = "activate";
</script>

<main data-testid="viz" style="padding: 1rem; max-width: 40rem">
  <h1>Data visualization</h1>

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
  </p>

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
</main>
