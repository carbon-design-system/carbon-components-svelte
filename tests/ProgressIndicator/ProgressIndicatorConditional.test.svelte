<script lang="ts">
  import { ProgressIndicator, ProgressStep } from "carbon-components-svelte";

  export let showOptional = true;
  export let currentIndex = 0;
</script>

<ProgressIndicator
  {currentIndex}
  on:change={(e) => console.log("change", e.detail)}
>
  <ProgressStep label="Step 1" complete />
  {#if showOptional}
    <ProgressStep label="Optional" complete />
  {/if}
  <ProgressStep label="Step 3" complete />
</ProgressIndicator>
