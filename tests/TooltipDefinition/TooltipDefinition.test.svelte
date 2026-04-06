<script lang="ts">
  import { TooltipDefinition } from "carbon-components-svelte";
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
</script>

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
  on:open={() => {
    console.log("open");
  }}
  on:close={() => {
    console.log("close");
  }}
>
  {triggerContent}
</TooltipDefinition>
