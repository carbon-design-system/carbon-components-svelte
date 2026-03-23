<script lang="ts">
  import { TooltipIcon } from "carbon-components-svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";

  export let tooltipText = "Test tooltip text";
  export let open = false;
  export let disabled = false;
  export let align: "start" | "center" | "end" = "center";
  export let direction: "top" | "right" | "bottom" | "left" = "bottom";
  export let id = "test-tooltip";
  export let icon = Carbon;
  export let size = 16;
  export let portalTooltip: boolean | undefined = undefined;
  export let enterDelayMs = 0;
  export let leaveDelayMs = 0;
</script>

<TooltipIcon
  {tooltipText}
  {open}
  {disabled}
  {align}
  {direction}
  {id}
  {icon}
  {size}
  {portalTooltip}
  {enterDelayMs}
  {leaveDelayMs}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:focus
  on:open={() => {
    console.log("open");
  }}
  on:close={() => {
    console.log("close");
  }}
>
  <slot name="tooltipText" />
  <slot />
</TooltipIcon>
