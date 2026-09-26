<script>
  import { Box, CodeSnippet } from "carbon-components-svelte";

  let multiCode =
    "export function isAdmin(role) {\n  return role === 'admin';\n}\n\nexport function isExpired(expiresAt) {\n  return Date.now() > expiresAt;\n}";
</script>

<!--
  The feedback tooltip is portalled by default, so it is not clipped even when
  the snippet sits in an `overflow: hidden` container. Set `portalTooltip` to
  `false` on any variant to use Carbon's inline feedback caret instead.
-->
<Box
  display="flex"
  direction="column"
  gap={4}
  overflow="hidden"
  border="subtle"
  borderStyle="dashed"
  padding={5}
  maxHeight="200px"
>
  <div>
    <CodeSnippet type="inline" code="rm -rf node_modules/" feedback="Copied!" />
  </div>

  <CodeSnippet code="npm i carbon-components-svelte" feedback="Copied!" />

  <CodeSnippet type="multi" code={multiCode} feedback="Copied!" />
</Box>
