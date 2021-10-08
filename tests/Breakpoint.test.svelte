<script lang="ts">
  import { Breakpoint } from "../types";
  import { BreakpointSize } from "../types/Breakpoint/Breakpoint";

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
