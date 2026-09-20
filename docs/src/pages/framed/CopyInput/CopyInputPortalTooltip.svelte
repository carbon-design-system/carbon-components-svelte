<script>
  import { Box, CopyInput, Stack } from "carbon-components-svelte";
</script>

<!--
  The feedback tooltip is portalled by default, so it is not clipped even when
  the input sits in an `overflow: hidden` container. Set `portalTooltip` to
  `false` to use Carbon's inline feedback caret, which is clipped here.
-->
<Box
  overflow="hidden"
  border="subtle"
  borderStyle="dashed"
  padding={5}
  maxHeight="160px"
>
  <Stack gap={4}>
    <CopyInput labelText="Portalled (default)" value="sk-1234567890abcdef" />
    <CopyInput
      labelText="Inline caret"
      value="sk-1234567890abcdef"
      portalTooltip={false}
    />
  </Stack>
</Box>
