<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Loading from "carbon-components-svelte/Loading/Loading.svelte";
  import { onMount } from "svelte";

  let active = false;

  // The test dispatches it; `svelte:window` has no type for a custom event.
  onMount(() => {
    const stop = () => (active = false);
    window.addEventListener("stop-loading", stop);
    return () => window.removeEventListener("stop-loading", stop);
  });
</script>

<Button on:click={() => (active = true)}>Save changes</Button>
<Button kind="secondary">Cancel</Button>

<Loading {active} description="Saving changes" />
