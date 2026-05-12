<script lang="ts">
  import { TooltipIcon } from "carbon-components-svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";

  export let enterDelayMs = 0;
  export let leaveDelayMs = 0;
</script>

<TooltipIcon
  data-testid="tooltip-a"
  tooltipText="Tooltip A"
  icon={Carbon}
  {enterDelayMs}
  {leaveDelayMs}
/>
<TooltipIcon
  data-testid="tooltip-b"
  tooltipText="Tooltip B"
  icon={Carbon}
  {enterDelayMs}
  {leaveDelayMs}
/>
<TooltipIcon
  data-testid="tooltip-c"
  tooltipText="Tooltip C"
  icon={Carbon}
  {enterDelayMs}
  {leaveDelayMs}
/>
