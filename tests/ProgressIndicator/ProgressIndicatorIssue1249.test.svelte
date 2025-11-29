<script lang="ts">
  import { ProgressIndicator, ProgressStep } from "carbon-components-svelte";
  import { onMount } from "svelte";

  export let stepsCompleted = [false, false, false];

  let currentIndex = 0;

  onMount(() => {
    stepsCompleted = [true, true, false];
    currentIndex = 0;
  });

  export function completeStep3() {
    stepsCompleted[2] = true;
  }
</script>

<ProgressIndicator bind:currentIndex>
  <ProgressStep complete={stepsCompleted[0]} label="Step 1" />
  <ProgressStep complete={stepsCompleted[1]} label="Step 2" />
  <ProgressStep complete={stepsCompleted[2]} label="Step 3" />
</ProgressIndicator>

<button on:click={completeStep3}>
  Click me twice
</button>
