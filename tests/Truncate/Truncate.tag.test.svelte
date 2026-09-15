<script lang="ts">
  import Truncate from "carbon-components-svelte/Truncate/Truncate.svelte";
  import type { ComponentProps } from "svelte";

  export let tag: ComponentProps<Truncate>["tag"] = "p";
  export let lines: ComponentProps<Truncate>["lines"] = 1;
  export let text =
    "This is a long text that should be truncated when it exceeds the available space";
</script>

<Truncate {tag} {lines}> {text} </Truncate>
