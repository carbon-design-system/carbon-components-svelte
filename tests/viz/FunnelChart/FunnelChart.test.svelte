<script lang="ts">
  import FunnelChart from "carbon-components-svelte/viz/FunnelChart/FunnelChart.svelte";

  export let stages = [
    { id: "visit", label: "Visitors", value: 10000 },
    { id: "signup", label: "Signup", value: 6000 },
    { id: "paid", label: "Paid", value: 900 },
  ];
  export let shape: "tapered" | "bars" = "tapered";
  export let selectedId: string | undefined = undefined;
  export let onselect: (detail: unknown) => void = () => {};
</script>

<FunnelChart
  {stages}
  {shape}
  title="Signup funnel"
  selectable
  locale="en-US"
  bind:selectedId
  on:select={(e) => onselect(e.detail)}
/>
<output data-testid="selected">{selectedId ?? ""}</output>
