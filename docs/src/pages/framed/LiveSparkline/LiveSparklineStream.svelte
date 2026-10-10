<script>
  import { BigNumber, Button, ButtonSet } from "carbon-components-svelte";
  import { LiveSparkline } from "carbon-components-svelte/viz";
  import { onMount } from "svelte";

  let live;
  let paused = false;
  let latest = 240;
  let rate = 240;

  onMount(() => {
    // Ten samples a second, batched to one draw per frame.
    const timer = setInterval(() => {
      rate = Math.max(50, Math.min(500, rate + (Math.random() - 0.5) * 40));
      live.push(Math.round(rate));
    }, 100);
    return () => clearInterval(timer);
  });
</script>

<ButtonSet>
  <Button size="small" kind="tertiary" on:click={() => (paused = !paused)}>
    {paused ? "Resume" : "Pause"}
  </Button>
</ButtonSet>

<BigNumber labelText="Requests per second" value={latest} />

<LiveSparkline
  bind:this={live}
  seed={Array.from({ length: 120 }, () => 240)}
  capacity={120}
  {paused}
  width={320}
  height={48}
  fill
  label="Requests per second, last twelve seconds"
  on:update={(e) => (latest = e.detail.values.at(-1) ?? latest)}
/>
