<script context="module">
  // Lazy load dependencies for performance.
  const asyncFormat = Promise.all([
    import("prettier/standalone"),
    import("prettier/parser-typescript"),
  ]).then(([prettier, typescriptParser]) => prettier.format);

  const asyncHighlight = import("prismjs").then((module) => {
    import("prismjs/components/prism-typescript");
    return module.highlight;
  });
</script>

<script>
  export let code = "";
  export let noFormat = false;
  export let type = "multi";

  import { CodeSnippet } from "carbon-components-svelte";
  import copy from "clipboard-copy";

  let formattedCode = "";
  let highlightedCode = "";

  $: {
    asyncFormat.then((format) => {
      try {
        formattedCode = noFormat
          ? code
          : format(code, { parser: "typescript", plugins: [typescriptParser] });
      } catch (e) {
        formattedCode = code;
      }
    });
  }

  $: {
    asyncHighlight.then((highlight) => {
      highlightedCode = highlight(
        formattedCode,
        Prism.languages.typescript,
        "typescript",
      );
    });
  }
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
