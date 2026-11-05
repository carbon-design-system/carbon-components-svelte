<script>
  import { HoverCard, Link, Stack } from "carbon-components-svelte";

  const previews = {
    "runbook-failover": {
      title: "Database failover runbook",
      summary:
        "Steps to promote a replica, verify replication lag, and repoint application traffic.",
      meta: "Updated 3 days ago by Marcus Webb",
    },
  };

  // For demo purposes only: simulates a request for the page's preview.
  async function loadPreview({ signal }) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    signal.throwIfAborted();
    return previews["runbook-failover"];
  }
</script>

<p>
  Follow the
  <HoverCard
    size="lg"
    load={loadPreview}
    cacheKey="runbook-failover"
    aria-label="Preview of the database failover runbook"
    let:data
  >
    <Link slot="trigger" href="#runbook-failover">failover runbook</Link>
    <Stack gap={3}>
      <strong>{data.title}</strong>
      <p>{data.summary}</p>
      <small>{data.meta}</small>
    </Stack>
  </HoverCard>
  before you promote the replica.
</p>
