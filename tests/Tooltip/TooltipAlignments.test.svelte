<script lang="ts">
  import { Tooltip } from "carbon-components-svelte";

  const alignments = ["start", "center", "end"] as const;
</script>

<div>
  {#each alignments as align}
    <div style="margin: 50px;">
      <Tooltip open={true} {align} iconDescription="Information">
        Tooltip with {align} alignment
      </Tooltip>
    </div>
  {/each}
</div>
