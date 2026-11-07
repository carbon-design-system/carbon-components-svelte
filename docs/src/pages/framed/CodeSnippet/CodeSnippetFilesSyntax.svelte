<script>
  import { CodeSnippet } from "carbon-components-svelte";
  import { highlightCode } from "carbon-components-svelte/syntax";

  const files = [
    {
      id: "main",
      title: "src/main.ts",
      code: `export const answer: number = 42;`,
    },
    {
      id: "style",
      title: "src/style.css",
      code: `.answer {\n  color: rebeccapurple;\n}`,
    },
  ];
  // `files` holds what the snippet shows; the language is yours to keep.
  /** @type {Record<string, string>} */
  const languages = { main: "ts", style: "css" };

  let selectedId = "main";
</script>

<div use:highlightCode={languages[selectedId]}>
  <CodeSnippet type="multi" {files} bind:selectedId />
</div>
