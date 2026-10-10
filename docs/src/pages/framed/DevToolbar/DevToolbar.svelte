<script>
  import {
    Button,
    Column,
    DevToolbar,
    Grid,
    Heading,
    Row,
    Stack,
    Tag,
    Text,
    TextInput,
    Tile,
  } from "carbon-components-svelte";
</script>

<Grid padding>
  <Row>
    <Column sm={4} md={5} lg={10}>
      <Stack gap={5}>
        <Heading type="productive-heading-04">Create a project</Heading>
        <Text>
          Turn tools on in the toolbar at the bottom. Click inside the frame,
          then try Alt+Shift+G (Option+Shift+G on macOS) for the grid.
        </Text>
        <TextInput labelText="Project name" placeholder="my-project" />
        <div>
          <Tag type="blue">beta</Tag>
          <Tag type="green">free tier</Tag>
        </div>
        <Button>Create</Button>
      </Stack>
    </Column>
    <Column sm={4} md={3} lg={6}>
      <Tile>
        <Stack gap={3}>
          <Text type="label-01" color="secondary">Monthly cost</Text>
          <Text type="productive-heading-05">$0.00</Text>
          <!-- Low contrast on purpose, for the Contrast tool. -->
          <p style="color: #a8a8a8; font-size: 0.75rem;">
            Billed at the end of the month
          </p>
        </Stack>
      </Tile>
    </Column>
  </Row>
</Grid>

<DevToolbar />

<!-- docs-only:start -->
<style>
  /* The overlay is fixed to the viewport, so drop the frame's side padding
     to line the Grid up with it, and hide the frame's column guides. */
  :global(body.framed) {
    padding-inline: 0;
  }

  :global(body.framed :not(.bx--content) [class^="bx--col"]) {
    box-shadow: none;
  }
</style>
<!-- docs-only:end -->
