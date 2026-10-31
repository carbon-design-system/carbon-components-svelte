<script lang="ts">
  import BumpChart from "carbon-components-svelte/viz/BumpChart/BumpChart.svelte";

  type Row = { week: string; team: string; rank?: number; points?: number };

  export let data: ReadonlyArray<Row> = [
    { week: "W1", team: "Ada", rank: 1 },
    { week: "W1", team: "Bell", rank: 2 },
    { week: "W1", team: "Cray", rank: 3 },
    { week: "W2", team: "Ada", rank: 2 },
    { week: "W2", team: "Bell", rank: 1 },
    { week: "W2", team: "Cray", rank: 3 },
    { week: "W3", team: "Ada", rank: 3 },
    { week: "W3", team: "Bell", rank: 1 },
    { week: "W3", team: "Cray", rank: 2 },
  ];
  export let byValue = false;
  export let selected: string | null = null;
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<BumpChart
  {data}
  x="week"
  rank={byValue ? undefined : "rank"}
  y={byValue ? "points" : undefined}
  series="team"
  title="Leaderboard"
  bind:selected
  data-testid="bump"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
/>
<output data-testid="selected">{selected ?? ""}</output>
