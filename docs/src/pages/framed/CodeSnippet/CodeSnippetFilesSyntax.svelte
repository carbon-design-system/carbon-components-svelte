<script>
  import { CodeSnippet } from "carbon-components-svelte";
  import { highlightCode } from "carbon-components-svelte/syntax";

  const files = [
    { title: "main.ts", code: `export const answer: number = 42;` },
    { title: "style.css", code: `.answer {\n  color: rebeccapurple;\n}` },
  ];
  // `files` holds what the snippet shows; the language is yours to keep.
  const languages = ["ts", "css"];

  let selectedIndex = 0;
</script>

<div use:highlightCode={languages[selectedIndex]}>
  <CodeSnippet type="multi" {files} bind:selectedIndex />
</div>
