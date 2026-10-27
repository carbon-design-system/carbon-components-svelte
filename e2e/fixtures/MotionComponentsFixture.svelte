<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import InlineLoading from "carbon-components-svelte/InlineLoading/InlineLoading.svelte";
  import Loading from "carbon-components-svelte/Loading/Loading.svelte";
  import { onMount } from "svelte";

  let saving = false;

  // The test dispatches it; `svelte:window` has no type for a custom event.
  onMount(() => {
    const stop = () => (saving = false);
    window.addEventListener("stop-saving", stop);
    return () => window.removeEventListener("stop-saving", stop);
  });
</script>

<Button on:click={() => (saving = true)}>Save changes</Button>

{#if saving}
  <InlineLoading transition description="Saving" data-testid="inline" />
  <Loading transition description="Saving changes" data-testid="overlay" />
{/if}
