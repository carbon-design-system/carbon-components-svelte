<script lang="ts">
  import MicroHistogram from "carbon-components-svelte/viz/MicroHistogram/MicroHistogram.svelte";

  export let values = [1, 2, 2, 3, 3, 3, 4, 4, 5, 9];
  const counted = [
    { x0: 0, x1: 10, count: 2 },
    { x0: 10, x1: 20, count: 8 },
    { x0: 20, x1: 30, count: 4 },
  ];
</script>

<MicroHistogram
  {values}
  bins={4}
  domain={[0, 10]}
  label="Latency"
  data-testid="basic"
/>
<MicroHistogram {values} data-testid="decorative" />
<MicroHistogram
  bins={counted}
  marker={25}
  color="success"
  size="sm"
  format={(v) => `${v} ms`}
  translations={{ range: "Bereich", marker: "jetzt" }}
  label="Latenz"
  data-testid="counted"
/>
<MicroHistogram values={[]} label="Empty" data-testid="empty" />
