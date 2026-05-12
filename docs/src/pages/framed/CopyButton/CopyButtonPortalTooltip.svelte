<script>
  import { CopyButton, Stack } from "carbon-components-svelte";
</script>

<Stack
  gap={4}
  style="overflow: hidden; border: 1px dashed var(--cds-border-subtle); padding: 1rem; max-height: 120px;"
>
  <CopyButton text="Carbon svelte" feedback="Copied!" portalTooltip={true} />
</Stack>
