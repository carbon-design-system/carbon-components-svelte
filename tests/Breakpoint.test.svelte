<script lang="ts">
  import { Breakpoint, breakpointObserver, breakpoints } from "carbon-components-svelte";
  import type { BreakpointProps } from "carbon-components-svelte/Breakpoint/Breakpoint.svelte";

  let size: BreakpointProps["size"];

  const sizeObserver = breakpointObserver();
  const smaller = sizeObserver.smallerThan("md");
  const larger = sizeObserver.largerThan("md");
</script>

{smaller}
{larger}
{breakpoints.md}

<Breakpoint
  bind:size
  let:size="{currentSize}"
  on:change="{(e) => {
    console.log(e.detail);
  }}"
>
  {currentSize}
</Breakpoint>
