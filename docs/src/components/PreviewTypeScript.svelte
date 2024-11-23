<script>
  export let code = "";
  export let noFormat = false;
  export let type = "multi";

  import { CodeSnippet } from "carbon-components-svelte";
  import { format } from "prettier/standalone";
  import { highlight } from "prismjs";
  import "prismjs/components/prism-typescript";
  import plugin from "prettier/parser-typescript";
  import copy from "clipboard-copy";

  let formattedCode = "";
  let highlightedCode = "";

  $: {
    try {
      formattedCode = noFormat
        ? code
        : format(code, { parser: "typescript", plugins: [plugin] });
    } catch (e) {
      formattedCode = code;
    }
  }

  $: highlightedCode = highlight(
    formattedCode,
    Prism.languages.typescript,
    "typescript",
  );
</script>

{#if type === "multi"}
  <div class="code-override">
    <CodeSnippet type="multi" code={formattedCode} {copy}>
      {@html highlightedCode}
    </CodeSnippet>
  </div>
{/if}

{#if type === "inline"}
  <CodeSnippet type="inline" code={formattedCode} {copy}>
    {@html highlightedCode}
  </CodeSnippet>
{/if}
