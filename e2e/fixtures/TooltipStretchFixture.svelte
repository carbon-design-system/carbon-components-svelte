<script>
  import {
    Stack,
    TooltipDefinition,
    TooltipIcon,
  } from "carbon-components-svelte";
  import Information from "carbon-icons-svelte/lib/Information.svelte";
</script>

<!-- A vertical Stack stretches its items to its own width by default. -->
<Stack data-testid="stack" gap={5}>
  <TooltipDefinition
    data-testid="tooltip-definition"
    tooltipText="Retained for 30 days"
  >
    Retention
  </TooltipDefinition>
  <TooltipIcon
    data-testid="tooltip-icon"
    tooltipText="Usage resets on the first of the month"
    icon={Information}
  />
</Stack>
