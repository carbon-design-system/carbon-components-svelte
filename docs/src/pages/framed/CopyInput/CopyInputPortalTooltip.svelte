<script>
  import { CopyInput, Stack } from "carbon-components-svelte";
</script>

<Stack
  gap={4}
  style="overflow: hidden; border: 1px dashed var(--cds-border-subtle); padding: 1rem; max-height: 120px;"
>
  <CopyInput
    labelText="API token"
    value="sk-1234567890abcdef"
    portalTooltip={true}
  />
</Stack>
