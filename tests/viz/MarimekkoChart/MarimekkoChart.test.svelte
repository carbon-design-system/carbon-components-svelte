<script lang="ts">
  import MarimekkoChart from "carbon-components-svelte/viz/MarimekkoChart/MarimekkoChart.svelte";

  type Row = { segment: string; vendor: string; share: number; size: number };

  export let data: ReadonlyArray<Row> = [
    { segment: "Enterprise", vendor: "Acme", share: 60, size: 300 },
    { segment: "Enterprise", vendor: "Beta", share: 40, size: 300 },
    { segment: "Mid-market", vendor: "Acme", share: 25, size: 100 },
    { segment: "Mid-market", vendor: "Beta", share: 50, size: 100 },
    { segment: "Mid-market", vendor: "Ce", share: 25, size: 100 },
  ];
  export let bySize = false;
  export let labels: "auto" | "none" = "auto";
  export let selected: { x: string; series: string } | null = null;
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<MarimekkoChart
  {data}
  x="segment"
  y="share"
  series="vendor"
  xValue={bySize ? "size" : undefined}
  {labels}
  title="Market map"
  bind:selected
  data-testid="marimekko"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
/>
<output data-testid="selected"
  >{selected ? `${selected.x}/${selected.series}` : ""}</output
>
