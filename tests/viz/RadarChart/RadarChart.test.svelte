<script lang="ts">
  import RadarChart from "carbon-components-svelte/viz/RadarChart/RadarChart.svelte";

  type Row = { skill: string; who: string; score: number };

  export let data: ReadonlyArray<Row> = [
    { skill: "Speed", who: "Ada", score: 80 },
    { skill: "Power", who: "Ada", score: 40 },
    { skill: "Range", who: "Ada", score: 60 },
    { skill: "Speed", who: "Bo", score: 30 },
    { skill: "Power", who: "Bo", score: 90 },
    { skill: "Range", who: "Bo", score: 10 },
  ];
  export let hidden: ReadonlyArray<string> = [];
  export let onhover: (detail: unknown) => void = () => {};
  export let ontoggle: (detail: unknown) => void = () => {};
</script>

<RadarChart
  {data}
  axis="skill"
  value="score"
  series="who"
  title="Skills"
  locale="en-US"
  bind:hidden
  on:hover={(e) => onhover(e.detail)}
  on:legend:toggle={(e) => ontoggle(e.detail)}
/>
<output data-testid="hidden">{hidden.join(",")}</output>
