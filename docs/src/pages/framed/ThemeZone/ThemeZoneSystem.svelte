<script>
  import {
    Box,
    Stack,
    Tag,
    Text,
    TextInput,
    ThemeZone,
    Toggle,
  } from "carbon-components-svelte";
</script>

<ThemeZone theme="system">
  <Box padding={5}>
    <Stack gap={5}>
      <Text type="heading-compact-01">Follows your system color scheme</Text>
      <TextInput labelText="Display name" value="Ada Lovelace" />
      <Toggle labelText="Email alerts" toggled />
      <div><Tag type="blue">White or Gray 100</Tag></div>
    </Stack>
  </Box>
</ThemeZone>
