<script lang="ts">
  import { Breakpoint } from "carbon-components-svelte";
  import type { BreakpointSize } from "carbon-components-svelte/Breakpoint/breakpoints";

  export let size: BreakpointSize | undefined = undefined;
  export let sizes: Record<BreakpointSize, boolean> = {
    sm: false,
    md: false,
    lg: false,
    xlg: false,
    max: false,
  };
  export let onchange: ((e: CustomEvent) => void) | undefined = undefined;
</script>

<Breakpoint
  bind:size
  bind:sizes
  {onchange}
  let:size={currentSize}
  let:sizes={currentSizes}
>
  <div data-testid="current-size">{currentSize}</div>
  <div data-testid="is-sm">{currentSizes.sm}</div>
  <div data-testid="is-md">{currentSizes.md}</div>
  <div data-testid="is-lg">{currentSizes.lg}</div>
  <div data-testid="is-xlg">{currentSizes.xlg}</div>
  <div data-testid="is-max">{currentSizes.max}</div>
</Breakpoint>
