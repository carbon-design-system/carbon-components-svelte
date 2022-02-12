<script lang="ts">
  import { Breakpoint } from "../types";
  import type { BreakpointProps } from "../types/Breakpoint/Breakpoint.svelte";

  let size: BreakpointProps["size"];
</script>

<Breakpoint
  bind:size
  let:size="{currentSize}"
  on:change="{(e) => {
    console.log(e.detail);
  }}"
>
  {currentSize}
</Breakpoint>
