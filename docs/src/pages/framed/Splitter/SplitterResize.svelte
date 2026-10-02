<script>
  import { Box, Button, Splitter, Stack, Text } from "carbon-components-svelte";

  let size = 30;
  let savedSize = 30;
</script>

<Stack gap={5}>
  <Box height="12rem" border="subtle">
    <Splitter
      bind:size
      min={15}
      max={60}
      separatorLabel="Resize service list"
      on:resize={(e) => (savedSize = e.detail.size)}
    >
      <Box slot="start" padding={5}>Services</Box>
      <Box slot="end" padding={5}>billing-api · us-south · 3 replicas</Box>
    </Splitter>
  </Box>
  <Text>Size: {size}% · Last saved: {savedSize}%</Text>
  <Button size="small" kind="tertiary" on:click={() => (size = 30)}>
    Reset layout
  </Button>
</Stack>
