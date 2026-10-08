<script>
  import {
    Box,
    Column,
    DevToolbar,
    Grid,
    Row,
    Stack,
    Text,
  } from "carbon-components-svelte";
  import Information from "carbon-icons-svelte/lib/Information.svelte";
</script>

<Grid padding>
  <Row>
    <Column>
      <Stack gap={5}>
        <Text>
          Turn on RTL in the toolbar. The first row uses logical spacing
          (margin-inline-end), so the icon keeps its gap from the text. The
          second uses physical spacing (margin-right), so in RTL the gap ends up
          on the wrong side.
        </Text>
        <Box display="flex" align="center">
          <Information style="margin-inline-end: 0.5rem;" />
          <span>Logical: margin-inline-end</span>
        </Box>
        <Box display="flex" align="center">
          <Information style="margin-right: 0.5rem;" />
          <span>Physical: margin-right</span>
        </Box>
      </Stack>
    </Column>
  </Row>
</Grid>

<DevToolbar persist={false} />
