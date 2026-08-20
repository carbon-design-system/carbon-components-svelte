<script>
  import { Stack, TooltipIcon } from "carbon-components-svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";

  let events = [];
</script>

<Stack gap={4}>
  <TooltipIcon
    tooltipText="Carbon is an open source design system by IBM."
    icon={Carbon}
    on:open={() => (events = [...events, "open"])}
    on:close={() => (events = [...events, "close"])}
  />
  <p>Dispatched events: {events.join(", ")}</p>
</Stack>
