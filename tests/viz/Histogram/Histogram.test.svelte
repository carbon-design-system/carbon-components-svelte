<script lang="ts">
  import Histogram from "carbon-components-svelte/viz/Histogram/Histogram.svelte";

  type Row = { ms: number | null };

  export let data: ReadonlyArray<Row> = [1, 2, 2, 3, 3, 3, 4, 4, 5, 9].map(
    (ms) => ({ ms }),
  );
  export let bins:
    | number
    | ReadonlyArray<{ x0: number; x1: number; count: number }> = 5;
  export let markers: ReadonlyArray<{ x: number; label?: string }> = [];
  export let onselect: (detail: unknown) => void = () => {};
</script>

<Histogram
  {data}
  x="ms"
  {bins}
  domain={[0, 10]}
  {markers}
  title="Latency"
  xTitle="Milliseconds"
  width={640}
  locale="en-US"
  on:select={(e) => onselect(e.detail)}
/>
