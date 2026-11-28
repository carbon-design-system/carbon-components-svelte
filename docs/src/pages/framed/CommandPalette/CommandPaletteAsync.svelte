<script>
  import {
    Button,
    CommandPalette,
    InlineLoading,
    Stack,
  } from "carbon-components-svelte";

  let open = true;
  let items = [];
  let loading = false;
  let failed = false;
  let query = "";
  let request = 0;

  const services = [
    "checkout-api",
    "billing-worker",
    "search-indexer",
    "auth-gateway",
    "media-transcoder",
    "notifications-cron",
  ];

  async function search(value) {
    query = value;
    const id = ++request;
    loading = true;
    failed = false;
    // Simulate a server search. A query with "cron" fails.
    await new Promise((resolve) => setTimeout(resolve, 600));
    // Drop a response that a newer search replaced.
    if (id !== request) return;
    loading = false;
    if (value.includes("cron")) {
      failed = true;
      return;
    }
    items = services
      .filter((name) => name.includes(value.trim().toLowerCase()))
      .map((name) => ({ id: name, text: name, description: "Web service" }));
  }
</script>

<Button on:click={() => (open = true)}>Find a service</Button>

<CommandPalette
  bind:open
  {items}
  {loading}
  loadingDelay={300}
  debounce={300}
  shouldFilter={false}
  placeholder="Find a service"
  labelText="Find a service"
  on:open={() => search("")}
  on:search={(event) => search(event.detail)}
>
  <svelte:fragment slot="footer">
    {#if failed}
      <Stack orientation="horizontal" gap={5} align="center">
        <InlineLoading
          status="error"
          description="Search failed. Results are from the last search."
        />
        <Button kind="ghost" size="small" on:click={() => search(query)}>
          Retry
        </Button>
      </Stack>
    {:else}
      Type a service name to search all regions.
    {/if}
  </svelte:fragment>
</CommandPalette>
