<script>
  import { CodeSnippet, Stack } from "carbon-components-svelte";
</script>

<!-- Click a snippet to copy; the "Copied!" feedback tooltip uses tooltipAlign. -->
<Stack gap={6}>
  <CodeSnippet code="position: top" tooltipAlign="top" />
  <CodeSnippet code="position: right" tooltipAlign="right" />
  <CodeSnippet code="position: bottom" tooltipAlign="bottom" />
  <CodeSnippet code="position: left" tooltipAlign="left" />
  <CodeSnippet type="inline" code="inline" tooltipAlign="right" />
</Stack>
