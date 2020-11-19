<script lang="ts">
  import { CodeSnippet, InlineNotification } from "../types";

  let code = `// helpers.js
  
export function multiply(a: number, b: number) {
  return a * b;
}

export function divide(a: number, b: number) {
  return a / b;
}

export function add(a: number, b: number) {
  return a + b;
}

export function subtract(a: number, b: number) {
  return a - b;
}`;

  let comment = `
> \`../types\` is a Svelte component library that implements the [Carbon Design System](https://github.com/carbon-design-system), an open source design system by IBM.

> A design system can facilitate frontend development and prototyping because it is encourages reuse, consistency, and extensibility.
`;
</script>

<InlineNotification
  svx-ignore
  lowContrast
  title="Note:"
  subtitle="By design, the copy button does not copy text to the clipboard. You will need to write your own logic."
  kind="info"
  hideCloseButton
/>

<CodeSnippet>yarn add -D carbon-components-svelte</CodeSnippet>

<CodeSnippet type="inline">rm -rf node_modules/</CodeSnippet>

<CodeSnippet type="multi" code="{code}" />

<CodeSnippet type="multi" code="{code}" hideCopyButton />

<CodeSnippet wrapText type="multi" code="{comment}" />

<CodeSnippet skeleton />

<CodeSnippet type="multi" skeleton />
