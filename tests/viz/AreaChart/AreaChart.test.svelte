<script lang="ts">
  import AreaChart from "carbon-components-svelte/viz/AreaChart/AreaChart.svelte";

  export let stack: "none" | "stacked" | "normalized" | "stream" = "none";
  export let hidden: ReadonlyArray<string | number> = [];

  const data = [
    { day: 0, channel: "a", sessions: 10 },
    { day: 1, channel: "a", sessions: 20 },
    { day: 2, channel: "a", sessions: 30 },
    { day: 0, channel: "b", sessions: 30 },
    { day: 1, channel: "b", sessions: 40 },
    { day: 2, channel: "b", sessions: 50 },
  ];
</script>

<AreaChart
  {data}
  x="day"
  y="sessions"
  series="channel"
  title="Sessions"
  width={640}
  {stack}
  bind:hidden
/>
