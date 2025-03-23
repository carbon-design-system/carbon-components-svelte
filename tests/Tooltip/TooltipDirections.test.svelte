<script lang="ts">
import { Tooltip } from "carbon-components-svelte";

const directions = ["top", "right", "bottom", "left"] as const;
</script>

<div>
  {#each directions as direction}
    <div style="margin: 50px;">
      <Tooltip open={true} {direction} iconDescription="Information">
        Tooltip with {direction} direction
      </Tooltip>
    </div>
  {/each}
</div>
