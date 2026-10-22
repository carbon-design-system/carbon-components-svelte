<script lang="ts">
  import ForestPlot from "carbon-components-svelte/viz/ForestPlot/ForestPlot.svelte";

  type Row = { study: string; or: number; lo: number; hi: number; n: number };

  export let data: ReadonlyArray<Row> = [
    { study: "North", or: 1.12, lo: 0.91, hi: 1.38, n: 400 },
    { study: "South", or: 0.94, lo: 0.8, hi: 1.1, n: 900 },
    { study: "EU", or: 1.21, lo: 1.02, hi: 1.48, n: 300 },
  ];
  export let overall: {
    estimate: number;
    lo: number;
    hi: number;
    label?: string;
  } | null = null;
  export let withWeight = false;
  export let scale: "linear" | "log" = "linear";
  export let selected: string | null = null;
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<ForestPlot
  {data}
  label="study"
  estimate="or"
  lo="lo"
  hi="hi"
  weight={withWeight ? "n" : undefined}
  {overall}
  {scale}
  nullValue={1}
  format={{ maximumFractionDigits: 2 }}
  title="Odds ratio by region"
  bind:selected
  data-testid="forest"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
/>
<output data-testid="selected">{selected ?? ""}</output>
