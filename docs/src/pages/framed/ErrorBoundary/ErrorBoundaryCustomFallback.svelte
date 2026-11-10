<script>
  import { Button, Stack, Tile } from "carbon-components-svelte";
  import { ErrorBoundary } from "carbon-components-svelte/boundary";

  let loaded = false;
  let requests = 0;

  // For demo purposes only: the first request fails, the retry succeeds.
  function loadReport() {
    requests += 1;
    if (requests === 1) throw new Error("Usage service timed out");
    return { region: "eu-de", storage: "4.2 TB" };
  }
</script>

<Stack gap={5}>
  <Button size="small" disabled={loaded} on:click={() => (loaded = true)}>
    Load report
  </Button>
  <ErrorBoundary>
    {#if loaded}
      {@const report = loadReport()}
      <Tile>Storage used in {report.region}: {report.storage}</Tile>
    {/if}
    <svelte:fragment slot="failed" let:error let:reset>
      <Tile>
        <Stack gap={5}>
          <p>
            Storage usage is unavailable: {error instanceof Error
              ? error.message
              : "unknown error"}.
          </p>
          <Button kind="tertiary" size="small" on:click={reset}>
            Reload usage
          </Button>
        </Stack>
      </Tile>
    </svelte:fragment>
  </ErrorBoundary>
</Stack>
