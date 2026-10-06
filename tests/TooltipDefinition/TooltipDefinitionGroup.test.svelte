<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import TooltipDefinition from "carbon-components-svelte/TooltipDefinition/TooltipDefinition.svelte";
  import TooltipGroup from "carbon-components-svelte/TooltipGroup/TooltipGroup.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
</script>

<TooltipGroup>
  <Button portalTooltip kind="ghost" icon={Edit} iconDescription="Edit" />
  <TooltipDefinition tooltipText="Annual percentage rate"
    >APR</TooltipDefinition
  >
</TooltipGroup>
