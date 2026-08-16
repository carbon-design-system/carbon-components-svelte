<svelte:options accessors />

<script lang="ts">
  import ProgressIndicator from "carbon-components-svelte/ProgressIndicator/ProgressIndicator.svelte";
  import ProgressStep from "carbon-components-svelte/ProgressIndicator/ProgressStep.svelte";

  export let count = 10;
</script>

<ProgressIndicator>
  {#each { length: count } as _, i}
    <ProgressStep label={`Step ${i}`} />
  {/each}
</ProgressIndicator>
