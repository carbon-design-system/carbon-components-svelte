<script>
  import { Button, Stack, Tile } from "carbon-components-svelte";
  import { ErrorBoundary } from "carbon-components-svelte/boundary";

  let loaded = false;
  let connected = false;

  function loadReport() {
    if (!connected) throw new Error("connect ECONNREFUSED 10.0.4.17:5432");
    return { region: "eu-de", storage: "4.2 TB" };
  }
</script>

<Stack gap={5}>
  <Button size="small" disabled={loaded} on:click={() => (loaded = true)}>
    Load report
  </Button>
  <ErrorBoundary showError retryText="">
    {#if loaded}
      {@const report = loadReport()}
      <Tile>Storage used in {report.region}: {report.storage}</Tile>
    {/if}
  </ErrorBoundary>
</Stack>
