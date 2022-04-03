<script lang="ts">
  import { TooltipIcon } from "../types";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";
  import Filter from "carbon-icons-svelte/lib/Filter.svelte";
  import FilterReset from "carbon-icons-svelte/lib/FilterReset.svelte";
</script>

<TooltipIcon tooltipText="Carbon is an open source design system by IBM.">
  <Carbon />
</TooltipIcon>

<TooltipIcon tooltipText="Top start" direction="top" align="start">
  <Filter />
</TooltipIcon>

<TooltipIcon tooltipText="Right end" direction="right" align="end">
  <Filter />
</TooltipIcon>

<TooltipIcon tooltipText="Bottom start" direction="bottom" align="start">
  <FilterReset />
</TooltipIcon>

<TooltipIcon tooltipText="Left start" direction="left" align="start">
  <FilterReset />
</TooltipIcon>

<TooltipIcon>
  <span slot="text" style="color: red"
    >Carbon is an open source design system by IBM.</span
  >
  <Carbon />
</TooltipIcon>
