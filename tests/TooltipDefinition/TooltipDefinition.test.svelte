<script lang="ts">
  import { TooltipDefinition } from "carbon-components-svelte";

  export let tooltipText = "Test tooltip text";
  export let open = false;
  export let align: "start" | "center" | "end" = "center";
  export let direction: "top" | "bottom" = "bottom";
  export let id = "test-tooltip";
  export let triggerContent = "Tooltip trigger";
</script>

<TooltipDefinition
  {tooltipText}
  {open}
  {align}
  {direction}
  {id}
  on:open={() => {
    console.log("open");
  }}
  on:close={() => {
    console.log("close");
  }}
>
  {triggerContent}
</TooltipDefinition>
