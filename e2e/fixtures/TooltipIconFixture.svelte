<script>
  import { TooltipIcon } from "carbon-components-svelte";
  import Information from "carbon-icons-svelte/lib/Information.svelte";
</script>

<div class="fixture-container">
  <TooltipIcon
    data-testid="tooltip-icon"
    tooltipText="Icon tooltip text"
    icon={Information}
  />
</div>

<style>
  .fixture-container {
    padding: 2rem;
  }
</style>
