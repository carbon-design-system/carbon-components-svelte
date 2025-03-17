<script lang="ts">
  import { truncate } from "carbon-components-svelte";

  export let clamp: "end" | "front" = "end";
  export let text =
    "This is a long text that should be truncated when it exceeds the available space";
  export let element: "h1" | "h2" | "h3" | "h4" | "p" | "span" = "p";
</script>

{#if element === "h1"}
  <h1 use:truncate={{ clamp }}>{text}</h1>
{:else if element === "h2"}
  <h2 use:truncate={{ clamp }}>{text}</h2>
{:else if element === "h3"}
  <h3 use:truncate={{ clamp }}>{text}</h3>
{:else if element === "h4"}
  <h4 use:truncate={{ clamp }}>{text}</h4>
{:else if element === "span"}
  <span use:truncate={{ clamp }}>{text}</span>
{:else}
  <p use:truncate={{ clamp }}>{text}</p>
{/if}
