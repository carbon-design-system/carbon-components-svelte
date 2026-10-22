<script lang="ts">
  import { truncate } from "carbon-components-svelte/Truncate/truncate";

  export let clamp: "end" | "front" = "end";
  export let element: "p" | "span" = "p";
  export let text =
    "This is a long text that should be truncated when it exceeds the available space";
</script>

<svelte:element this={element} use:truncate={{ clamp }}>{text}</svelte:element>
