<script>
  import { Box, Column, Grid, Row, Stack } from "carbon-components-svelte";
</script>

<Stack gap={5}>
  <Box padding={5}>
    Adding padding to Grid applies it to columns in all rows:
  </Box>

  <Grid padding>
    <Row>
      <Column>Column</Column>
      <Column>Column</Column>
      <Column>Column</Column>
      <Column>Column</Column>
    </Row>
  </Grid>

  <Box padding={5}> Adding padding to a Row only applies to its columns: </Box>

  <Grid>
    <Row padding>
      <Column>Column</Column>
      <Column>Column</Column>
      <Column>Column</Column>
      <Column>Column</Column>
    </Row>
    <Row>
      <Column>Column</Column>
      <Column>Column</Column>
      <Column>Column</Column>
      <Column>Column</Column>
    </Row>
  </Grid>

  <Box padding={5}>
    Adding padding to a specific column only applies it to the column:
  </Box>

  <Grid>
    <Row>
      <Column padding>Column</Column>
      <Column>Column</Column>
      <Column>Column</Column>
      <Column>Column</Column>
    </Row>
  </Grid>
</Stack>
