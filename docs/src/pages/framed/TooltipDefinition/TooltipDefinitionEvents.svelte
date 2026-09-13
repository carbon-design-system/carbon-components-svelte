<script>
  import { TooltipDefinition } from "carbon-components-svelte";

  let events = [];
</script>

<TooltipDefinition
  align="start"
  tooltipText="Single sign-on: one login for all connected applications."
  on:open={() => (events = [...events, "open"])}
  on:close={() => (events = [...events, "close"])}
>
  Dispatched events: {events.join(", ")}
</TooltipDefinition>
