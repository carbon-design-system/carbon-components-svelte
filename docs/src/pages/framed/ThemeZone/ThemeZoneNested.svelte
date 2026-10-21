<script>
  import {
    Box,
    Stack,
    Tag,
    Text,
    TextInput,
    ThemeZone,
  } from "carbon-components-svelte";
</script>

<ThemeZone theme="g100">
  <Box padding={5}>
    <Stack gap={5}>
      <Text type="heading-compact-01">Gray 100</Text>
      <TextInput labelText="Cluster" value="prod-us-east" />
      <ThemeZone theme="white">
        <Box padding={5}>
          <Stack gap={5}>
            <Text type="heading-compact-01">White inside Gray 100</Text>
            <TextInput labelText="Node pool" value="general-purpose" />
            <ThemeZone theme="g90">
              <Box padding={5}>
                <Stack gap={5}>
                  <Text type="heading-compact-01">Gray 90 inside White</Text>
                  <div><Tag type="green">3 of 3 nodes ready</Tag></div>
                </Stack>
              </Box>
            </ThemeZone>
          </Stack>
        </Box>
      </ThemeZone>
    </Stack>
  </Box>
</ThemeZone>
