<script lang="ts">
  import ProgressIndicator from "carbon-components-svelte/ProgressIndicator/ProgressIndicator.svelte";
  import ProgressStep from "carbon-components-svelte/ProgressIndicator/ProgressStep.svelte";

  export let showOptional = true;
  export let currentIndex = 0;
  export let onchange: ((event: CustomEvent) => void) | undefined = undefined;
</script>

<ProgressIndicator {currentIndex} on:change={(e) => onchange?.(e)}>
  <ProgressStep label="Step 1" complete />
  {#if showOptional}
    <ProgressStep label="Optional" complete />
  {/if}
  <ProgressStep label="Step 3" complete />
</ProgressIndicator>
