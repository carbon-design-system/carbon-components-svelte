<script>
  import { Button, ButtonSet } from "carbon-components-svelte";
  import { LineChart } from "carbon-components-svelte/viz";

  const MINUTE = 60_000;
  let now = new Date(2026, 0, 1, 9).getTime();
  let value = 50;

  function next() {
    now += MINUTE;
    value = Math.max(5, Math.min(95, value + (Math.random() - 0.5) * 12));
    return { time: new Date(now), cpu: Math.round(value) };
  }

  const data = Array.from({ length: 30 }, next);
  let chart;
</script>

<ButtonSet>
  <Button size="small" kind="tertiary" on:click={() => chart.push(next())}>
    Add a minute
  </Button>
</ButtonSet>

<LineChart
  bind:this={chart}
  {data}
  maxRows={60}
  x="time"
  y="cpu"
  title="CPU utilization"
  yDomain={[0, 100]}
  height={220}
  points="none"
  legend={false}
/>
