<script>
  import {
    Button,
    Column,
    Grid,
    Heading,
    Row,
    Stack,
    Tag,
    Text,
    TextInput,
    Tile,
  } from "carbon-components-svelte";
  import { DevToolbar } from "carbon-components-svelte/devtools";
</script>

<Grid padding>
  <Row>
    <Column sm={4} md={5} lg={10}>
      <Stack gap={5}>
        <Heading type="heading-04">Create a project</Heading>
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
          <Text type="heading-05">$0.00</Text>
          <p class="faint">Billed at the end of the month</p>
        </Stack>
      </Tile>
    </Column>
  </Row>
</Grid>

<DevToolbar />

<style>
  /* Low contrast on purpose, for the contrast check. */
  .faint {
    color: #a8a8a8;
    font-size: 0.75rem;
  }
</style>

<!-- docs-only:start -->
<svelte:head>
  <style>
    /* The overlay is fixed to the viewport, so drop the frame's side padding
       to line the Grid up with it, and hide the frame's column guides. */
    body.framed {
      padding-inline: 0;
    }

    body.framed :not(.bx--content) [class^="bx--col"] {
      box-shadow: none;
    }
  </style>
</svelte:head>
<!-- docs-only:end -->
