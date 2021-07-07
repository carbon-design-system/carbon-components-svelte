<script lang="ts">
  import { Breakpoint } from "../types";

  let size;
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
