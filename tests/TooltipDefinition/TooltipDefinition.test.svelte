<script lang="ts">
  import TooltipDefinition from "carbon-components-svelte/TooltipDefinition/TooltipDefinition.svelte";
  import type { ComponentProps } from "svelte";

  export let tooltipText = "Test tooltip text";
  export let open = false;
  export let align: ComponentProps<TooltipDefinition>["align"] = "center";
  export let direction: ComponentProps<TooltipDefinition>["direction"] =
    "bottom";
  export let id = "test-tooltip";
  export let clickToOpen = false;
  export let triggerContent = "Tooltip trigger";
  export let portalTooltip: ComponentProps<TooltipDefinition>["portalTooltip"] =
    undefined;
  export let enterDelayMs = 0;
  export let leaveDelayMs = 0;
  export let onOpen: () => void = () => {};
  export let onClose: () => void = () => {};
  export let onParentKeydown: (event: KeyboardEvent) => void = () => {};
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:keydown={onParentKeydown}>
  <TooltipDefinition
    {tooltipText}
    {open}
    {align}
    {direction}
    {id}
    {clickToOpen}
    {portalTooltip}
    {enterDelayMs}
    {leaveDelayMs}
    on:open={onOpen}
    on:close={onClose}
  >
    {triggerContent}
  </TooltipDefinition>
</div>
