<script>
  import { Box, CopyButton } from "carbon-components-svelte";
</script>

<!--
  The feedback tooltip is portalled by default, so it is not clipped even when
  the button sits in an `overflow: hidden` container. Set `portalTooltip` to
  `false` to use Carbon's inline feedback caret, which is clipped here.
-->
<Box
  display="flex"
  direction="column"
  gap={4}
  overflow="hidden"
  border="subtle"
  borderStyle="dashed"
  padding={5}
  maxHeight="120px"
>
  <CopyButton
    text="https://api.acme.io/webhooks/incoming/f8a2c91d"
    feedback="Portalled (default)"
    tooltipAlignment="start"
  />
  <CopyButton
    text="https://api.acme.io/webhooks/incoming/f8a2c91d"
    feedback="Inline caret"
    portalTooltip={false}
    tooltipAlignment="start"
  />
</Box>
