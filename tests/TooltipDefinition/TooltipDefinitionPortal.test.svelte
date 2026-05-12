<script lang="ts">
  import { TooltipDefinition } from "carbon-components-svelte";

  const directions = ["top", "bottom"] as const;
</script>

<div>
  {#each directions as direction}
    <div style="margin: 50px;">
      <TooltipDefinition
        portalTooltip
        open={true}
        tooltipText="Portal tooltip {direction}"
        {direction}
      >
        Definition {direction}
      </TooltipDefinition>
    </div>
  {/each}
</div>
