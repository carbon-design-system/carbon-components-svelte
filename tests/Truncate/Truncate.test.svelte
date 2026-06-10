<script lang="ts">
  import Truncate from "carbon-components-svelte/Truncate/Truncate.svelte";
  import type { ComponentProps } from "svelte";

  export let clamp: ComponentProps<Truncate>["clamp"] = "end";
  export let lines: ComponentProps<Truncate>["lines"] = 1;
  export let text =
    "This is a long text that should be truncated when it exceeds the available space";
</script>

<Truncate {clamp} {lines}> {text} </Truncate>
