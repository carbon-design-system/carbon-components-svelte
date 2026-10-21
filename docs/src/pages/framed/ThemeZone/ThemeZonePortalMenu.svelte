<script>
  import { Box, Dropdown, ThemeZone } from "carbon-components-svelte";
</script>

<ThemeZone theme="g100">
  <Box overflow="hidden" maxHeight="8rem" padding={5}>
    <Dropdown
      portalMenu
      labelText="Region"
      selectedId="0"
      items={[
        { id: "0", text: "Oregon (us-west-2)" },
        { id: "1", text: "Virginia (us-east-1)" },
        { id: "2", text: "Frankfurt (eu-central-1)" },
      ]}
    />
  </Box>
</ThemeZone>
