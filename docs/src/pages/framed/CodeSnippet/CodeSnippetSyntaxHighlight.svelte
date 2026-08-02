<script>
  import { CodeSnippet } from "carbon-components-svelte";
  import Prism from "prismjs";
  import "prismjs/components/prism-typescript";

  const code = `export function add(a: number, b: number) {
  return a + b;
}

export function subtract(a: number, b: number) {
  return a - b;
}`;

  const highlighted = Prism.highlight(
    code,
    Prism.languages.typescript,
    "typescript",
  );
</script>

<CodeSnippet type="multi" {code}> {@html highlighted} </CodeSnippet>
