<script>
  import { Box, Dropdown } from "carbon-components-svelte";
</script>

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
</Box>
