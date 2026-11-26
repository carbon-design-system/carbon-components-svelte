<script>
  import {
    Button,
    ListItem,
    Stack,
    Tile,
    UnorderedList,
  } from "carbon-components-svelte";
  import { ErrorBoundary } from "carbon-components-svelte/boundary";

  let loaded = false;
  let requests = 0;
  let failures = [];

  // For demo purposes only: the first two requests fail.
  function loadReport() {
    requests += 1;
    if (requests <= 2) throw new Error(`Request ${requests} timed out`);
    return { region: "eu-de", storage: "4.2 TB" };
  }
</script>

<Stack gap={5}>
  <Button size="small" disabled={loaded} on:click={() => (loaded = true)}>
    Load report
  </Button>
  <ErrorBoundary
    retryText="Reload usage"
    on:error={(e) => {
      failures = [...failures, String(e.detail.error)];
    }}
  >
    {#if loaded}
      {@const report = loadReport()}
      <Tile>Storage used in {report.region}: {report.storage}</Tile>
    {/if}
  </ErrorBoundary>
  {#if failures.length > 0}
    <UnorderedList>
      {#each failures as failure}
        <ListItem>{failure}</ListItem>
      {/each}
    </UnorderedList>
  {/if}
</Stack>
