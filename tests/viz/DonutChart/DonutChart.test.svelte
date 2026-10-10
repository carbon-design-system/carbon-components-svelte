<script lang="ts">
  import DonutChart from "carbon-components-svelte/viz/DonutChart/DonutChart.svelte";

  type Row = { device: string; sessions: number };

  export let data: ReadonlyArray<Row> = [
    { device: "Tablet", sessions: 11 },
    { device: "Desktop", sessions: 52 },
    { device: "Mobile", sessions: 31 },
    { device: "TV", sessions: 4 },
    { device: "Watch", sessions: 2 },
  ];
  export let selectable = false;
  export let maxSlices = 6;
  export let valueType: "percent" | "value" | "both" = "percent";
  export let selected: string | null = null;
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<DonutChart
  {data}
  value="sessions"
  category="device"
  title="Sessions by device"
  locale="en-US"
  {selectable}
  {maxSlices}
  {valueType}
  bind:selected
  data-testid="donut"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
  let:formattedTotal
  let:active
>
  <span data-testid="center">{active ? active.label : formattedTotal}</span>
</DonutChart>
<output data-testid="selected">{selected ?? ""}</output>
