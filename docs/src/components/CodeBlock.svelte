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
  import Prism from "prismjs";
  import "prismjs/components/prism-bash";
  import "prismjs/components/prism-typescript";
  import "prism-svelte";
  import copy from "clipboard-copy";

  $: grammar = Prism.languages[language] ?? Prism.languages.clike;
  $: highlighted = Prism.highlight(code, grammar, language);
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
