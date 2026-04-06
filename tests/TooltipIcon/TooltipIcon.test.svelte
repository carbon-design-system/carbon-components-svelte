<script lang="ts">
  import { TooltipIcon } from "carbon-components-svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";
  import type { ComponentProps } from "svelte";

  export let tooltipText = "Test tooltip text";
  export let open = false;
  export let disabled = false;
  export let align: ComponentProps<TooltipIcon>["align"] = "center";
  export let direction: ComponentProps<TooltipIcon>["direction"] = "bottom";
  export let id = "test-tooltip";
  export let icon = Carbon;
  export let size = 16;
  export let portalTooltip: ComponentProps<TooltipIcon>["portalTooltip"] =
    undefined;
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
