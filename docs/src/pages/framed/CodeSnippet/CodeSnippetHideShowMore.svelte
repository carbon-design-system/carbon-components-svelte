<script>
  import { CodeSnippet } from "carbon-components-svelte";

  let code =
    "export function add(a: number, b: number) {\n  return a + b;\n}\n\nexport function subtract(a: number, b: number) {\n  return a - b;\n}\n\nexport function multiply(a: number, b: number) {\n  return a * b;\n}\n\nexport function divide(a: number, b: number) {\n  return a / b;\n}\n\nexport function modulo(a: number, b: number) {\n  return a % b;\n}\n\nexport function power(a: number, b: number) {\n  return a ** b;\n}\n\nexport function negate(a: number) {\n  return -a;\n}";
</script>

<CodeSnippet type="multi" {code} showMoreLess={false} />
