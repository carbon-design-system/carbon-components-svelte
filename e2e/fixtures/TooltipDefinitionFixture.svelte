<script lang="ts">
  import { TooltipDefinition } from "carbon-components-svelte";
</script>

<!-- Room around the trigger, so its centered tooltip fits in the window and
     opens in place. -->
<div style="padding: 1rem 6rem">
  <TooltipDefinition
    data-testid="tooltip-definition"
    tooltipText="Definition tooltip text"
  >
    Definition trigger
  </TooltipDefinition>
</div>
