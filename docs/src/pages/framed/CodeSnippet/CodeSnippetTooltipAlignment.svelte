<script>
  import { CodeSnippet, Stack } from "carbon-components-svelte";
</script>

<!-- Alignment positions the tooltip along the copy button edge. -->
<Stack gap={6}>
  <CodeSnippet code="alignment: bottom-start" tooltipAlign="bottom-start" />
  <CodeSnippet code="alignment: bottom" tooltipAlign="bottom" />
  <CodeSnippet code="alignment: bottom-end" tooltipAlign="bottom-end" />
</Stack>
