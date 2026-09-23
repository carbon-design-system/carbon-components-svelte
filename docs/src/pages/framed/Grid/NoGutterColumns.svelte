<script>
  import { Box, Column, Grid, Row, Stack } from "carbon-components-svelte";
</script>

<Stack gap={5}>
  <Box padding={5}>
    Adding noGutter to Grid removes the gutter from every column:
  </Box>

  <Grid noGutter>
    <Row>
      <Column>Column</Column>
      <Column>Column</Column>
      <Column>Column</Column>
      <Column>Column</Column>
    </Row>
  </Grid>

  <Box padding={5}>
    Adding noGutterLeft or noGutterRight to individual columns removes only that
    side's gutter—useful for flushing a column against a page edge or divider:
  </Box>

  <Grid>
    <Row>
      <Column noGutterLeft>No left gutter</Column>
      <Column>Column</Column>
      <Column>Column</Column>
      <Column noGutterRight>No right gutter</Column>
    </Row>
  </Grid>
</Stack>
