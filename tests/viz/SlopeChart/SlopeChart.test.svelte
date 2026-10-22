<script lang="ts">
  import SlopeChart from "carbon-components-svelte/viz/SlopeChart/SlopeChart.svelte";

  type Row = { year: number; team: string; score: number | null };

  export let data: ReadonlyArray<Row> = [
    { year: 2024, team: "Web", score: 62 },
    { year: 2024, team: "Data", score: 58 },
    { year: 2024, team: "Mobile", score: 41 },
    { year: 2025, team: "Web", score: 71 },
    { year: 2025, team: "Data", score: 39 },
    { year: 2025, team: "Mobile", score: 41 },
  ];
  export let colorBy: "direction" | "series" | "none" = "direction";
  export let positive: "up" | "down" = "up";
  export let selected: string | null = null;
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<SlopeChart
  {data}
  x="year"
  y="score"
  series="team"
  {colorBy}
  {positive}
  title="Score change"
  bind:selected
  data-testid="slope"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
/>
<output data-testid="selected">{selected ?? ""}</output>
