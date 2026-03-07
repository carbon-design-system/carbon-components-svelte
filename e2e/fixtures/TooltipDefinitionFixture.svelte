<script>
  import { TooltipDefinition } from "carbon-components-svelte";

</script>

<div class="fixture-container">
  <TooltipDefinition
    data-testid="tooltip-definition"
    tooltipText="Definition tooltip text"
  >
    Definition trigger
  </TooltipDefinition>
</div>

<style>
  .fixture-container {
    padding: 2rem;
  }
</style>
