<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import TooltipGroup from "carbon-components-svelte/TooltipGroup/TooltipGroup.svelte";
  import TooltipIcon from "carbon-components-svelte/TooltipIcon/TooltipIcon.svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";

  export let portalTooltip = false;
</script>

<TooltipGroup enterDelayMs={200}>
  <Button portalTooltip kind="ghost" icon={Edit} iconDescription="Edit" />
  <TooltipIcon
    data-testid="tooltip-icon"
    tooltipText="Synced"
    icon={Carbon}
    {portalTooltip}
  />
</TooltipGroup>
