<script lang="ts">
  import Tooltip from "carbon-components-svelte/Tooltip/Tooltip.svelte";

  export let portalTooltip = false;
</script>

<Tooltip open={true} iconDescription="Information" {portalTooltip}>
  This tooltip is initially open
</Tooltip>
