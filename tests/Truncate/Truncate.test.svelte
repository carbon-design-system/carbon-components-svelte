<script lang="ts">
  import { Truncate } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let clamp: ComponentProps<Truncate>["clamp"] = "end";
  export let text =
    "This is a long text that should be truncated when it exceeds the available space";
</script>

<Truncate {clamp}> {text} </Truncate>
