<script>
  import {
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
        <div class="row">
          <Information style="margin-inline-end: 0.5rem;" />
          <span>Logical: margin-inline-end</span>
        </div>
        <div class="row">
          <Information style="margin-right: 0.5rem;" />
          <span>Physical: margin-right</span>
        </div>
      </Stack>
    </Column>
  </Row>
</Grid>

<DevToolbar persist={false} />

<style>
  .row {
    display: flex;
    align-items: center;
  }
</style>
