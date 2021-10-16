<script lang="ts">
  import { Breakpoint } from "../types";
  import type { BreakpointSize } from "../types/Breakpoint/Breakpoint.svelte";

  let size: BreakpointSize;
</script>

<Breakpoint
  bind:size
  let:size="{currentSize}"
  on:match="{(e) => {
    console.log(e.detail);
  }}"
>
  {currentSize}
</Breakpoint>
