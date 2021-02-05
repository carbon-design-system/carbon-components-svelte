<script lang="ts">
  import { TooltipIcon } from "../types";
  import Carbon24 from "carbon-icons-svelte/lib/Carbon24";
  import Filter20 from "carbon-icons-svelte/lib/Filter20";
</script>

<TooltipIcon tooltipText="Carbon is an open source design system by IBM.">
  <Carbon24 />
</TooltipIcon>

<TooltipIcon tooltipText="Top start" direction="top" align="start">
  <Filter20 />
</TooltipIcon>

<TooltipIcon tooltipText="Right end" direction="right" align="end">
  <Filter20 />
</TooltipIcon>

<TooltipIcon tooltipText="Bottom start" direction="bottom" align="start">
  <Filter20 />
</TooltipIcon>

<TooltipIcon tooltipText="Left start" direction="left" align="start">
  <Filter20 />
</TooltipIcon>

<TooltipIcon>
  <span slot="text" style="color: red"
    >Carbon is an open source design system by IBM.</span
  >
  <Carbon24 />
</TooltipIcon>
