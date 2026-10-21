<script>
  import {
    Box,
    Layer,
    Stack,
    TextInput,
    ThemeZone,
  } from "carbon-components-svelte";
</script>

<Layer withBackground>
  <Box padding={5}>
    <Stack gap={5}>
      <TextInput labelText="Page, layer 2" placeholder="field-02" />
      <ThemeZone theme="g100">
        <Box padding={5}>
          <Stack gap={5}>
            <TextInput labelText="Zone, layer 1" placeholder="field-01" />
            <Layer withBackground>
              <Box padding={5}>
                <TextInput labelText="Zone, layer 2" placeholder="field-02" />
              </Box>
            </Layer>
          </Stack>
        </Box>
      </ThemeZone>
    </Stack>
  </Box>
</Layer>
