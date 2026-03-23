<script lang="ts">
  import { TooltipIcon } from "carbon-components-svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";

  const directions = ["top", "right", "bottom", "left"] as const;
</script>

<div>
  {#each directions as direction}
    <div style="margin: 50px;">
      <TooltipIcon
        portalTooltip
        enterDelayMs={0}
        leaveDelayMs={0}
        tooltipText="Portal tooltip {direction}"
        {direction}
        icon={Carbon}
      />
    </div>
  {/each}
</div>
