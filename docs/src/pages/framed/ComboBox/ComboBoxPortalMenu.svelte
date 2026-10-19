<script>
  import { Box, ComboBox } from "carbon-components-svelte";
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
    This container has hidden overflow. The menu would not fit, so it opens in a
    portal.
  </div>
  <ComboBox
    labelText="Alert channel"
    placeholder="Select alert channel"
    items={[
      { id: "0", text: "Slack" },
      { id: "1", text: "Email" },
      { id: "2", text: "Webhook" },
    ]}
  />
</Box>
