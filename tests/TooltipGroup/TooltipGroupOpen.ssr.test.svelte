<script lang="ts">
  import TooltipDefinition from "carbon-components-svelte/TooltipDefinition/TooltipDefinition.svelte";
  import TooltipGroup from "carbon-components-svelte/TooltipGroup/TooltipGroup.svelte";
  import TooltipIcon from "carbon-components-svelte/TooltipIcon/TooltipIcon.svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";
</script>

<TooltipGroup>
  <TooltipDefinition open tooltipText="Annual percentage rate"
    >APR</TooltipDefinition
  >
  <TooltipIcon open tooltipText="Synced" icon={Carbon} />
</TooltipGroup>
