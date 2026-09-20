<script>
  import { Box, Dropdown, Stack } from "carbon-components-svelte";
</script>

<Box
  overflow="hidden"
  border="subtle"
  borderStyle="dashed"
  padding={5}
  maxHeight="120px"
>
  <Stack gap={4}>
    <div>
      This container has hidden overflow. Without <code>portalMenu</code>, the
      dropdown would be clipped.
    </div>
    <Dropdown
      portalMenu
      labelText="Preferred channel"
      selectedId="0"
      items={[
        { id: "0", text: "Slack" },
        { id: "1", text: "Email" },
        { id: "2", text: "Fax" },
      ]}
    />
  </Stack>
</Box>
