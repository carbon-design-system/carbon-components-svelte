<script>
  import { CodeSnippet, Stack } from "carbon-components-svelte";

  let comment =
    "> carbon-components-svelte is a Svelte component library that implements the [Carbon Design System](https://github.com/carbon-design-system), an open source design system by IBM.\n\n> A design system can facilitate frontend development and prototyping because it is encourages reuse, consistency, and extensibility.\n";
</script>

<Stack gap={2}>
  <CodeSnippet disabled code="npm i carbon-components-svelte" />
  <CodeSnippet disabled type="multi" code={comment} />
</Stack>
