<script>
export let code = "";
export let type = "multi";

import { CodeSnippet } from "carbon-components-svelte";
import { highlight } from "prismjs";
import "prismjs/components/prism-typescript";
import copy from "clipboard-copy";

$: highlightedCode = highlight(code, Prism.languages.typescript, "typescript");
</script>

{#if type === "multi"}
  <div class="code-override">
    <CodeSnippet type="multi" {code} {copy}>
      {@html highlightedCode}
    </CodeSnippet>
  </div>
{/if}

{#if type === "inline"}
  <CodeSnippet type="inline" class="code-override-inline" {code} {copy}>
    {@html highlightedCode}
  </CodeSnippet>
{/if}
