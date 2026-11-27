<script>
  import {
    Box,
    Button,
    Stack,
    Text,
    ThemeBuilder,
    ThemeZone,
  } from "carbon-components-svelte";
</script>

<ThemeBuilder hideContrast hideExport>
  <svelte:fragment slot="preview" let:theme let:style>
    <ThemeZone {theme} {style}>
      <Box padding={5}>
        <Stack gap={5}>
          <Text type="heading-compact-01">Your own preview</Text>
          <div><Button>Primary</Button></div>
          <ThemeZone {theme}>
            <Box padding={5}>
              <Stack gap={3}>
                <Text type="heading-compact-01">Nested without the style</Text>
                <div><Button>Stock tokens</Button></div>
              </Stack>
            </Box>
          </ThemeZone>
          <ThemeZone {theme} {style}>
            <Box padding={5}>
              <Stack gap={3}>
                <Text type="heading-compact-01">Nested with the style</Text>
                <div><Button>Your tokens</Button></div>
              </Stack>
            </Box>
          </ThemeZone>
        </Stack>
      </Box>
    </ThemeZone>
  </svelte:fragment>
</ThemeBuilder>
