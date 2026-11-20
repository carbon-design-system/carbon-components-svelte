<script>
  import {
    CodeSnippet,
    Stack,
    Text,
    ThemeBuilder,
  } from "carbon-components-svelte";

  let base = "white";
  let tokens = {};
  let resolved = {};
</script>

<Stack gap={5}>
  <ThemeBuilder bind:base bind:tokens bind:resolved hideContrast hideExport />
  <Text type="heading-compact-01">
    {Object.keys(tokens).length} edited, {Object.keys(resolved).length} changed
  </Text>
  <CodeSnippet
    type="multi"
    code={`<Theme theme="${base}" tokens={${JSON.stringify(resolved, null, 2)}} />`}
  />
</Stack>
