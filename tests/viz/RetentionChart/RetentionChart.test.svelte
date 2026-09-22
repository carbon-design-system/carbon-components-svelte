<script lang="ts">
  import RetentionChart from "carbon-components-svelte/viz/RetentionChart/RetentionChart.svelte";

  export let data = ["Jan", "Feb"].flatMap((cohort, c) =>
    [0, 7, 14, 30].map((day, i) => ({
      cohort,
      day,
      retained: [1, 0.6 - c * 0.1, 0.45 - c * 0.1, 0.4 - c * 0.1][i],
    })),
  );
  export let baseline: number | undefined = undefined;
  export let onhover: (detail: unknown) => void = () => {};
</script>

<RetentionChart
  {data}
  x="day"
  y="retained"
  series="cohort"
  {baseline}
  title="Retention by cohort"
  width={640}
  height={240}
  data-testid="chart"
  on:hover={(e) => onhover(e.detail)}
/>
