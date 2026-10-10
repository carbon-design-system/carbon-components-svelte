<script lang="ts">
  import LiveSparkline from "carbon-components-svelte/viz/LiveSparkline/LiveSparkline.svelte";

  export let seed: number[] = [1, 2, 3];
  export let capacity = 5;
  export let paused = false;
  export let value: number | undefined = undefined;

  let live: LiveSparkline;
  let shown: ReadonlyArray<number | null> = [];
  let counter = 10;

  function next() {
    return counter++;
  }
</script>

<LiveSparkline
  bind:this={live}
  {seed}
  {capacity}
  {paused}
  {value}
  label="Requests"
  data-testid="live"
  on:update={(e) => (shown = e.detail.values)}
/>
<button type="button" on:click={() => live.push(next())}>push</button>
<button type="button" on:click={() => live.push([next(), next(), next()])}>
  burst
</button>
<output data-testid="shown">{shown.join(",")}</output>
