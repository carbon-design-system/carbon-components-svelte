<script lang="ts">
  import DumbbellChart from "carbon-components-svelte/viz/DumbbellChart/DumbbellChart.svelte";

  type Row = { team: string; year: string; score: number };

  export let data: ReadonlyArray<Row> = [
    { team: "Web", year: "2025", score: 62 },
    { team: "Web", year: "2026", score: 78 },
    { team: "Data", year: "2025", score: 71 },
    { team: "Data", year: "2026", score: 65 },
  ];
  export let orientation: "vertical" | "horizontal" = "horizontal";
</script>

<DumbbellChart
  {data}
  x="team"
  y="score"
  series="year"
  title="Scores by team"
  width={640}
  locale="en-US"
  {orientation}
/>
