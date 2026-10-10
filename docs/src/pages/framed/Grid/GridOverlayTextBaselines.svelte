<script>
  import {
    Button,
    Column,
    Grid,
    GridOverlay,
    Heading,
    Row,
    Select,
    SelectItem,
    Stack,
    Tag,
    Text,
    TextInput,
    Tile,
  } from "carbon-components-svelte";

  let baseline = 8;
</script>

<Grid padding>
  <Row>
    <Column sm={4} md={4} lg={6}>
      <Stack gap={5}>
        <Select labelText="Baseline step" bind:selected={baseline}>
          <SelectItem value={0} text="Off (marks only)" />
          <SelectItem value={4} text="4px" />
          <SelectItem value={8} text="8px" />
        </Select>
        <Heading type="productive-heading-03">Create a project</Heading>
        <Text>
          Green marks sit on a row. Red marks miss one, labeled with how many
          pixels. The badge counts lines on a row.
        </Text>
        <TextInput labelText="Project name" placeholder="my-project" />
        <div>
          <Tag type="blue">beta</Tag>
          <Tag type="green">free tier</Tag>
        </div>
        <Button size="field">Create</Button>
      </Stack>
    </Column>
    <Column sm={4} md={4} lg={6}>
      <Tile>
        <Stack gap={3}>
          <Text type="label-01" color="secondary">Monthly cost</Text>
          <Text type="productive-heading-05">$0.00</Text>
          <Text type="helper-text-01" color="helper"
            >Billed at the end of the month</Text
          >
        </Stack>
      </Tile>
    </Column>
  </Row>
</Grid>

<GridOverlay
  open
  columns={false}
  baseline={Number(baseline)}
  baselineEmphasis={0}
  textBaselines
  label
/>

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
