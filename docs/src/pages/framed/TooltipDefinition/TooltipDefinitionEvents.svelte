<script>
  import { TooltipDefinition } from "carbon-components-svelte";

  let events = [];
</script>

<TooltipDefinition
  align="start"
  tooltipText="IBM Corporate Headquarters is based in Armonk, New York."
  on:open={() => (events = [...events, "open"])}
  on:close={() => (events = [...events, "close"])}
>
  Dispatched events: {events.join(", ")}
</TooltipDefinition>
