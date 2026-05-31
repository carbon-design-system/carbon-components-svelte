<script lang="ts">
  export let code = "";
  export let highlighted = "";
  export let type: "multi" | "inline" = "multi";
  export let portalTooltip: boolean | undefined = undefined;

  import { CodeSnippet } from "carbon-components-svelte";
  import copy from "clipboard-copy";
</script>

{#if type === "multi"}
  <div class="code-override">
    <CodeSnippet type="multi" {code} {copy} {portalTooltip}>
      {@html highlighted}
    </CodeSnippet>
  </div>
{:else}
  <CodeSnippet
    type="inline"
    class="code-override-inline"
    {code}
    {copy}
    {portalTooltip}
  >
    {@html highlighted}
  </CodeSnippet>
{/if}
