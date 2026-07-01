<script>
  import { CodeSnippet, Stack } from "carbon-components-svelte";
</script>

<!-- Click a snippet to copy; the "Copied!" feedback tooltip uses tooltipPosition. -->
<Stack gap={6}>
  <CodeSnippet code="position: top" tooltipPosition="top" />
  <CodeSnippet code="position: right" tooltipPosition="right" />
  <CodeSnippet code="position: bottom" tooltipPosition="bottom" />
  <CodeSnippet code="position: left" tooltipPosition="left" />
  <CodeSnippet type="inline" code="inline" tooltipPosition="right" />
</Stack>
