<script lang="ts">
  import { Tooltip } from "carbon-components-svelte";
  import { onMount } from "svelte";

  let input: HTMLInputElement | null = null;

  onMount(() => {
    input?.focus();
  });
</script>

<Tooltip iconDescription="Information">
  <input type="text" bind:this={input} />
</Tooltip>
