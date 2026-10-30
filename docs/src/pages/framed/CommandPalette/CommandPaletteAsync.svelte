<script>
  import { Button, CommandPalette } from "carbon-components-svelte";

  let open = true;
  let items = [];
  let loading = false;
  let request = 0;

  const services = [
    "checkout-api",
    "billing-worker",
    "search-indexer",
    "auth-gateway",
    "media-transcoder",
    "notifications-cron",
  ];

  async function search(query) {
    const id = ++request;
    loading = true;
    // Simulate a server search.
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (id !== request) return;
    items = services
      .filter((name) => name.includes(query.trim().toLowerCase()))
      .map((name) => ({ id: name, text: name, description: "Web service" }));
    loading = false;
  }

  search("");
</script>

<Button on:click={() => (open = true)}>Find a service</Button>

<CommandPalette
  bind:open
  {items}
  {loading}
  debounce={300}
  shouldFilter={false}
  placeholder="Find a service"
  labelText="Find a service"
  on:open={() => search("")}
  on:search={(event) => search(event.detail)}
/>
