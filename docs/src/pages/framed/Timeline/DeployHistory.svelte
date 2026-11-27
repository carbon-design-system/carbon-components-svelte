<script>
  import { Button, Timeline } from "carbon-components-svelte";

  const now = Date.UTC(2026, 10, 6, 15, 0);
  const at = (days, hour, minute = 0) =>
    Date.UTC(2026, 10, 6 - days, hour, minute);

  const deploys = [
    {
      id: "d1",
      time: at(0, 14, 20),
      titleText: "Deployed v2.4.1 to production",
      descriptionText: "Triggered by Ada Okafor.",
      status: "success",
    },
    {
      id: "d2",
      time: at(0, 11, 5),
      titleText: "Deploy v2.4.0 failed",
      descriptionText: "Health check timed out after 120 s.",
      status: "error",
    },
    {
      id: "d3",
      time: at(0, 11, 2),
      titleText: "Rolled back to v2.3.9",
      status: "warning",
    },
    {
      id: "d4",
      time: at(1, 17, 45),
      titleText: "Deployed v2.3.9 to staging",
      status: "info",
    },
    {
      id: "d5",
      time: at(3, 10, 30),
      titleText: "Deployed v2.3.8 to production",
      status: "success",
    },
  ];
</script>

<Timeline
  aria-label="Deploys"
  items={deploys}
  order="desc"
  groupBy="day"
  {now}
  timeZone="UTC"
>
  <svelte:fragment slot="content" let:item>
    {#if item.status === "error"}
      <Button size="sm" kind="tertiary">View log</Button>
    {/if}
  </svelte:fragment>
</Timeline>
