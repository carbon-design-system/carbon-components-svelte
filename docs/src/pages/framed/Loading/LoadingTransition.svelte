<script>
  import { Button, Loading, Stack } from "carbon-components-svelte";

  let loading = false;

  async function simulateRequest() {
    loading = true;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    loading = false;
  }
</script>

<Stack orientation="horizontal" gap={5} align="center">
  <Button on:click={simulateRequest}>Load (1.5 s)</Button>
  {#if loading}
    <Loading transition withOverlay={false} small />
  {/if}
</Stack>
