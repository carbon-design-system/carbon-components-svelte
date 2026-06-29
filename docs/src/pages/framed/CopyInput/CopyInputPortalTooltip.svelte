<script>
  import { CopyInput, Stack } from "carbon-components-svelte";
</script>

<!--
  The feedback tooltip is portalled by default, so it is not clipped even when
  the input sits in an `overflow: hidden` container. Set `portalTooltip` to
  `false` to use Carbon's inline feedback caret, which is clipped here.
-->
<Stack
  gap={4}
  style="overflow: hidden; border: 1px dashed var(--cds-border-subtle); padding: 1rem; max-height: 160px;"
>
  <CopyInput labelText="Portalled (default)" value="sk-1234567890abcdef" />
  <CopyInput
    labelText="Inline caret"
    value="sk-1234567890abcdef"
    portalTooltip={false}
  />
</Stack>
