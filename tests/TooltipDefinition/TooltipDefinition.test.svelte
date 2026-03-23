<script lang="ts">
  import { TooltipDefinition } from "carbon-components-svelte";

  export let tooltipText = "Test tooltip text";
  export let open = false;
  export let align: "start" | "center" | "end" = "center";
  export let direction: "top" | "bottom" = "bottom";
  export let id = "test-tooltip";
  export let clickToOpen = false;
  export let triggerContent = "Tooltip trigger";
  export let portalTooltip: boolean | undefined = undefined;
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
