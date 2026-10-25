<script>
  import { Box, CodeSnippet, Stack, Toggle } from "carbon-components-svelte";

  let toggled = false;

  const code = Array.from({ length: 20 }, (_, i) => i + 1).join("\n");
</script>

<Stack gap={5}>
  <Toggle size="sm" labelText="Show code snippet" bind:toggled />
  <Box display={toggled ? undefined : "none"}>
    <CodeSnippet type="multi" {code} />
  </Box>
</Stack>
