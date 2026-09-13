<script>
  import { CodeSnippet, Stack } from "carbon-components-svelte";

  let multiCode =
    "export function isAdmin(role) {\n  return role === 'admin';\n}\n\nexport function isExpired(expiresAt) {\n  return Date.now() > expiresAt;\n}";
</script>

<!--
  The feedback tooltip is portalled by default, so it is not clipped even when
  the snippet sits in an `overflow: hidden` container. Set `portalTooltip` to
  `false` on any variant to use Carbon's inline feedback caret instead.
-->
<Stack
  gap={4}
  style="overflow: hidden; border: 1px dashed var(--cds-border-subtle); padding: 1rem; max-height: 200px;"
>
  <div>
    <CodeSnippet type="inline" code="rm -rf node_modules/" feedback="Copied!" />
  </div>

  <CodeSnippet code="npm i carbon-components-svelte" feedback="Copied!" />

  <CodeSnippet type="multi" code={multiCode} feedback="Copied!" />
</Stack>
