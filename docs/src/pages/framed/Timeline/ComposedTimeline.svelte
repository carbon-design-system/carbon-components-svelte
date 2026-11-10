<script>
  import { Link, Timeline, TimelineItem } from "carbon-components-svelte";

  const now = Date.UTC(2026, 10, 6, 15, 0);
</script>

<Timeline aria-label="Case 4821">
  <TimelineItem
    time={Date.UTC(2026, 10, 4, 10, 0)}
    {now}
    timeZone="UTC"
    status="success"
  >
    <svelte:fragment slot="titleChildren">
      Opened by <Link href="/">Priya Raman</Link>
    </svelte:fragment>
    <svelte:fragment slot="descriptionChildren">
      The export <strong>times out</strong> on large workspaces.
    </svelte:fragment>
  </TimelineItem>
  <TimelineItem
    time={Date.UTC(2026, 10, 5, 13, 30)}
    {now}
    timeZone="UTC"
    title="Assigned to Support"
    description="Priority raised to high."
    status="warning"
  />
  <TimelineItem title="Awaiting a fix" status="pending" />
</Timeline>
