<script>
  import { CodeSnippet, Stack } from "carbon-components-svelte";
</script>

<!-- Alignment positions the tooltip along the copy button edge. -->
<Stack gap={6}>
  <CodeSnippet code="alignment: start" tooltipAlignment="start" />
  <CodeSnippet code="alignment: center" tooltipAlignment="center" />
  <CodeSnippet code="alignment: end" tooltipAlignment="end" />
</Stack>
