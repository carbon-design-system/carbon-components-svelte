<script lang="ts">
  import WaterfallChart from "carbon-components-svelte/viz/WaterfallChart/WaterfallChart.svelte";

  type Row = { step: string; change: number };

  export let data: ReadonlyArray<Row> = [
    { step: "Start", change: 100 },
    { step: "Sales", change: 60 },
    { step: "Refunds", change: -30 },
    { step: "End", change: 0 },
  ];
  export let totals: ReadonlyArray<string> = ["End"];
  export let onselect: (detail: unknown) => void = () => {};
</script>

<WaterfallChart
  {data}
  x="step"
  y="change"
  {totals}
  title="Revenue bridge"
  width={640}
  locale="en-US"
  on:select={(e) => onselect(e.detail)}
/>
