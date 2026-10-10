<script>
  import {
    Button,
    Column,
    Grid,
    LayoutInspector,
    Row,
    Stack,
    Tag,
    Text,
    Tile,
    Toggle,
  } from "carbon-components-svelte";

  let open = true;
</script>

<Grid padding>
  <Row>
    <Column>
      <Stack gap={6}>
        <Toggle labelText="Inspector" size="sm" bind:toggled={open} />
        <Text>
          Hover anything. Magenta is margin, green is padding, blue is the
          content box. Each value is labeled; a red label is off the Carbon
          spacing scale.
        </Text>
      </Stack>
    </Column>
  </Row>
  <Row>
    <Column sm={4} md={4} lg={6}>
      <Tile>
        <Stack gap={4}>
          <Text type="heading-02">Usage this month</Text>
          <Text type="body-short-01" color="secondary">
            3 of 5 projects active
          </Text>
          <div>
            <Tag type="green">Healthy</Tag>
          </div>
          <Button size="small" kind="tertiary">View details</Button>
        </Stack>
      </Tile>
    </Column>
  </Row>
</Grid>

<LayoutInspector {open} />
