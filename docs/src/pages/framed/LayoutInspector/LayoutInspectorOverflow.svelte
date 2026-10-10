<script>
  import {
    Column,
    Grid,
    LayoutInspector,
    Row,
    Stack,
    Text,
  } from "carbon-components-svelte";
</script>

<Grid padding>
  <Row>
    <Column>
      <Stack gap={5}>
        <Text>
          This frame scrolls sideways. The banner below is the culprit: it is a
          fixed 1600px wide.
        </Text>
        <div class="banner">A 1600px banner</div>
        <div class="truncate">
          A long label truncated with an ellipsis because its box is too narrow
          to show it all
        </div>
        <div class="clip">
          A box with overflow: hidden and a fixed height, so the end of this
          text is cut off without any sign that there is more of it to read.
        </div>
        <div class="scroll">
          A scrolling box is left alone: overflow: auto means the extra content
          is reachable. Lorem ipsum dolor sit amet, consectetur adipiscing elit,
          sed do eiusmod tempor incididunt ut labore.
        </div>
      </Stack>
    </Column>
  </Row>
</Grid>

<LayoutInspector open spacing={false} overflow />

<style>
  .banner {
    width: 1600px;
    padding: 1rem;
    background: var(--cds-ui-01, #f4f4f4);
  }

  .truncate {
    width: 16rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .clip {
    width: 16rem;
    height: 2.5rem;
    overflow: hidden;
  }

  .scroll {
    width: 16rem;
    height: 2.5rem;
    overflow: auto;
  }
</style>
