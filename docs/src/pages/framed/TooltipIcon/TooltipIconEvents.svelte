<script>
  import { Stack, TooltipIcon } from "carbon-components-svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";

  let events = [];
</script>

<Stack gap={4}>
  <TooltipIcon
    tooltipText="Metrics are aggregated across every workspace in your organization."
    icon={Carbon}
    on:open={() => (events = [...events, "open"])}
    on:close={() => (events = [...events, "close"])}
  />
  <p>Dispatched events: {events.join(", ")}</p>
</Stack>
