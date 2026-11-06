<script>
  import {
    ComboBox,
    createAsyncSource,
    Stack,
    Toggle,
  } from "carbon-components-svelte";

  const services = [
    "api-gateway",
    "auth-service",
    "billing-worker",
    "search-indexer",
    "notification-hub",
  ];

  let down = false;
  let attempts = 0;

  // Simulate a service that is down until the toggle is turned off.
  const results = createAsyncSource(
    async (query) => {
      attempts += 1;
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (down) throw new Error("Service unavailable");
      return services
        .filter((name) => name.includes(query.toLowerCase()))
        .map((name) => ({ id: name, text: name }));
    },
    {
      debounce: 150,
      retry: { count: 2, delay: 600 },
      cache: { ttl: 30_000 },
    },
  );
</script>

<Stack gap={5}>
  <Toggle
    labelText="Search service"
    labelA="Up"
    labelB="Down"
    bind:toggled={down}
  />
  <ComboBox
    labelText="Service"
    placeholder="Search services"
    source={results}
    items={[]}
    errorText="Search is unavailable. Type to try again."
  />
  <p>Requests sent: {attempts}</p>
</Stack>
