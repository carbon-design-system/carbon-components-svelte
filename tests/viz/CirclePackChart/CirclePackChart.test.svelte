<script lang="ts">
  import CirclePackChart from "carbon-components-svelte/viz/CirclePackChart/CirclePackChart.svelte";

  type Row = { team: string; repo: string; commits: number };

  export let data: ReadonlyArray<Row> = [
    { team: "Platform", repo: "gateway", commits: 400 },
    { team: "Platform", repo: "scheduler", commits: 225 },
    { team: "Data", repo: "warehouse", commits: 225 },
    { team: "Data", repo: "etl", commits: 25 },
  ];
  export let grouped = true;
  export let onhover: (detail: unknown) => void = () => {};
  export let onselect: (detail: unknown) => void = () => {};
</script>

<CirclePackChart
  {data}
  value="commits"
  label="repo"
  group={grouped ? "team" : undefined}
  title="Commits by repository"
  locale="en-US"
  data-testid="pack"
  on:hover={(e) => onhover(e.detail)}
  on:select={(e) => onselect(e.detail)}
/>
