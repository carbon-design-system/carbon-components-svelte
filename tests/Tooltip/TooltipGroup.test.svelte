<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Tooltip from "carbon-components-svelte/Tooltip/Tooltip.svelte";
  import TooltipGroup from "carbon-components-svelte/TooltipGroup/TooltipGroup.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
</script>

<TooltipGroup>
  <Button portalTooltip kind="ghost" icon={Edit} iconDescription="Edit" />
  <Tooltip iconDescription="Information">Details</Tooltip>
</TooltipGroup>
