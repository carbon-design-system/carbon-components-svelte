<script>
  import { CodeSnippet, Stack, Toggle } from "carbon-components-svelte";

  let expandable = false;

  $: length = expandable ? 24 : 4;
  $: code = Array.from(
    { length },
    (_, i) => `const line${i + 1} = ${i + 1};`,
  ).join("\n");
</script>

<Stack gap={5}>
  <Toggle bind:toggled={expandable} size="sm" labelText="Grow content" />
  <CodeSnippet type="multi" {code} />
</Stack>
