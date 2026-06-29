<script>
  import { CopyButton, Stack } from "carbon-components-svelte";
</script>

<!--
  The feedback tooltip is portalled by default, so it is not clipped even when
  the button sits in an `overflow: hidden` container. Set `portalTooltip` to
  `false` to use Carbon's inline feedback caret, which is clipped here.
-->
<Stack
  gap={4}
  style="overflow: hidden; border: 1px dashed var(--cds-border-subtle); padding: 1rem; max-height: 120px;"
>
  <CopyButton
    text="Carbon svelte"
    feedback="Portalled (default)"
    tooltipAlignment="start"
  />
  <CopyButton
    text="Carbon svelte"
    feedback="Inline caret"
    portalTooltip={false}
    tooltipAlignment="start"
  />
</Stack>
