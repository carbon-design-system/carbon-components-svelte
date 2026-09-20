<script>
  import { Box, CodeSnippet, Stack } from "carbon-components-svelte";

  let multiCode =
    "export function isAdmin(role) {\n  return role === 'admin';\n}\n\nexport function isExpired(expiresAt) {\n  return Date.now() > expiresAt;\n}";
</script>

<!--
  The feedback tooltip is portalled by default, so it is not clipped even when
  the snippet sits in an `overflow: hidden` container. Set `portalTooltip` to
  `false` on any variant to use Carbon's inline feedback caret instead.
-->
<Box
  overflow="hidden"
  border="subtle"
  borderStyle="dashed"
  padding={5}
  maxHeight="200px"
>
  <Stack gap={4}>
    <div>
      <CodeSnippet
        type="inline"
        code="rm -rf node_modules/"
        feedback="Copied!"
      />
    </div>

    <CodeSnippet code="npm i carbon-components-svelte" feedback="Copied!" />

    <CodeSnippet type="multi" code={multiCode} feedback="Copied!" />
  </Stack>
</Box>
