<script lang="ts">
  import { TooltipIcon } from "carbon-components-svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";

  export let tooltipText = "Test tooltip text";
  export let disabled = false;
  export let align: "start" | "center" | "end" = "center";
  export let direction: "top" | "right" | "bottom" | "left" = "bottom";
  export let id = "test-tooltip";
  export let icon = Carbon;
  export let size = 16;
</script>

<TooltipIcon
  {tooltipText}
  {disabled}
  {align}
  {direction}
  {id}
  {icon}
  {size}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:focus
>
  <slot name="tooltipText" />
  <slot />
</TooltipIcon>
