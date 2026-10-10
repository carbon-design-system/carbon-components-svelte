<script lang="ts">
  export let code = "";
  export let language: "bash" | "svelte" | "javascript" | "typescript" = "bash";
  export let type: "single" | "multi" | "inline" = "multi";
  export let hideCopyButton = false;
  export let showMoreLess = true;
  export let expanded = false;
  export let wrapText = false;
  export let portalTooltip: boolean | undefined = undefined;

  import { CodeSnippet } from "carbon-components-svelte";
  import { highlight } from "carbon-components-svelte/syntax";
  import copy from "clipboard-copy";

  $: highlighted =
    highlight(code, language) ??
    code.replace(/&/g, "&amp;").replace(/</g, "&lt;");
</script>

{#if type === "inline"}
  <CodeSnippet
    type="inline"
    class="code-override-inline"
    {code}
    copy={(text) => copy(text)}
    {portalTooltip}
  >
    {@html highlighted}
  </CodeSnippet>
{:else}
  <div class="code-override">
    <CodeSnippet
      {type}
      {code}
      {hideCopyButton}
      {showMoreLess}
      {expanded}
      {wrapText}
      copy={(text) => copy(text)}
      {portalTooltip}
    >
      {@html highlighted}
    </CodeSnippet>
  </div>
{/if}
