<script>
  import { CodeSnippet, Stack } from "carbon-components-svelte";

  let multiCode =
    "export function add(a, b) {\n  return a + b;\n}\n\nexport function subtract(a, b) {\n  return a - b;\n}";
</script>

<Stack
  gap={4}
  style="overflow: hidden; border: 1px dashed var(--cds-border-subtle); padding: 1rem; max-height: 200px;"
>
  <div>
    <CodeSnippet
      type="inline"
      code="rm -rf node_modules/"
      feedback="Copied!"
      portalTooltip={true}
    />
  </div>

  <CodeSnippet
    code="npm i carbon-components-svelte"
    feedback="Copied!"
    portalTooltip={true}
  />

  <CodeSnippet
    type="multi"
    code={multiCode}
    feedback="Copied!"
    portalTooltip={true}
  />
</Stack>
