<script lang="ts">
  export let code = "";
  export let language: "bash" | "svelte" | "javascript" | "typescript" = "bash";
  export let type: "single" | "multi" = "multi";
  export let hideCopyButton = false;
  export let showMoreLess = false;
  export let expanded = false;
  export let wrapText = false;

  import { CodeSnippet } from "carbon-components-svelte";
  import Prism from "prismjs";
  import "prismjs/components/prism-bash";
  import "prismjs/components/prism-typescript";
  import "prism-svelte";
  import copy from "clipboard-copy";

  $: grammar = Prism.languages[language] ?? Prism.languages.clike;
  $: highlighted = Prism.highlight(code, grammar, language);
</script>

<div class="code-override">
  <CodeSnippet
    {type}
    {code}
    {hideCopyButton}
    {showMoreLess}
    {expanded}
    {wrapText}
    copy={(text) => copy(text)}
  >
    {@html highlighted}
  </CodeSnippet>
</div>
