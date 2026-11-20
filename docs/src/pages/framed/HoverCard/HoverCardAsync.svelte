<script>
  import { HoverCard, Link, Stack, Tag } from "carbon-components-svelte";

  let requests = 0;
  let failNext = true;

  // For demo purposes only: simulates a request that fails once.
  async function loadIncident({ signal }) {
    requests += 1;
    await new Promise((resolve) => setTimeout(resolve, 800));
    signal.throwIfAborted();
    if (failNext) {
      failNext = false;
      throw new Error("The status service did not respond.");
    }
    return {
      status: "Mitigated",
      summary: "Elevated 5xx rate on the checkout API in eu-west-1.",
    };
  }
</script>

<Stack gap={5} align="start">
  <p>
    Latest incident:
    <HoverCard
      load={loadIncident}
      cacheKey="incident-2291"
      aria-label="Incident 2291"
      let:data
    >
      <Link slot="trigger" href="#incident-2291">INC-2291</Link>
      <Tag type="green">{data.status}</Tag>
      <p>{data.summary}</p>
    </HoverCard>
  </p>
  <p>Requests sent: {requests}</p>
</Stack>
