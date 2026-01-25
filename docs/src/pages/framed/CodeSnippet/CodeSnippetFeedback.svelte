<script>
  import { CodeSnippet } from "carbon-components-svelte";

  let code =
    "export function multiply(a: number, b: number) {\n  return a * b;\n}\n\nexport function divide(a: number, b: number) {\n  return a / b;\n}\n\nexport function add(a: number, b: number) {\n  return a + b;\n}\n\nexport function subtract(a: number, b: number) {\n  return a - b;\n}";
</script>

<CodeSnippet type="multi" {code} feedback="Copied to clipboard" />
