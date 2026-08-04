<script lang="ts">
  import ProgressIndicator from "carbon-components-svelte/ProgressIndicator/ProgressIndicator.svelte";
  import ProgressStep from "carbon-components-svelte/ProgressIndicator/ProgressStep.svelte";

  export let currentIndex = 0;
  export let selectedId: string | undefined = undefined;
  export let showStepA = true;
</script>

<ProgressIndicator
  bind:currentIndex
  bind:selectedId
  on:change={({ detail }) => console.log("change", detail)}
>
  {#if showStepA}
    <ProgressStep id="step-a" label="Step A" complete />
  {/if}
  <ProgressStep id="step-b" label="Step B" complete />
  <ProgressStep id="step-c" label="Step C" />
</ProgressIndicator>

<button
  type="button"
  data-testid="toggle-step-a"
  on:click={() => (showStepA = !showStepA)}
>
  Toggle Step A
</button>
<div data-testid="current-index">{currentIndex}</div>
<div data-testid="selected-id">{selectedId ?? ""}</div>
