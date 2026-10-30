<script>
  import InlineLoading from "carbon-components-svelte/InlineLoading/InlineLoading.svelte";
  import Loading from "carbon-components-svelte/Loading/Loading.svelte";

  let duration = 100;
  let active = false;
  let started = false;

  async function run() {
    started = true;
    active = true;
    await new Promise((resolve) => setTimeout(resolve, duration));
    active = false;
  }
</script>

<input data-testid="duration" type="number" bind:value={duration} />
<button data-testid="run" type="button" on:click={run}>Run</button>

<!-- `active` toggles on a Loading that stays mounted. -->
<div data-testid="toggled">
  <Loading withOverlay={false} small {active} delay={300} />
</div>

<!-- Loading mounts when the work starts and unmounts when it ends. -->
<div data-testid="mounted">
  {#if active}
    <Loading withOverlay={false} small delay={300} />
  {/if}
</div>

<!-- InlineLoading mounts with the first run, then stays. -->
<div data-testid="inline">
  {#if started}
    <InlineLoading
      status={active ? "active" : "finished"}
      description={active ? "Saving" : "Saved"}
      delay={300}
    />
  {/if}
</div>
