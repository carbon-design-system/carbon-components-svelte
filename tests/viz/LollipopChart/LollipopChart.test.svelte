<script lang="ts">
  import LollipopChart from "carbon-components-svelte/viz/LollipopChart/LollipopChart.svelte";

  type Row = { month: string; team: string; net: number };

  export let data: ReadonlyArray<Row> = [
    { month: "Jan", team: "a", net: 10 },
    { month: "Feb", team: "a", net: -5 },
    { month: "Jan", team: "b", net: 20 },
    { month: "Feb", team: "b", net: 15 },
  ];
  export let orientation: "vertical" | "horizontal" = "vertical";
  export let onselect: (detail: unknown) => void = () => {};
</script>

<LollipopChart
  {data}
  x="month"
  y="net"
  series="team"
  title="Net new accounts"
  width={640}
  locale="en-US"
  {orientation}
  on:select={(e) => onselect(e.detail)}
/>
