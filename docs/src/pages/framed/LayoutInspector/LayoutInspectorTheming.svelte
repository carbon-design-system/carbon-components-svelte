<script>
  import {
    Column,
    Grid,
    LayoutInspector,
    Row,
    Stack,
    Text,
    Theme,
    Tile,
    Toggle,
  } from "carbon-components-svelte";

  let custom = false;
</script>

<Grid padding>
  <Row>
    <Column sm={4} md={4} lg={6}>
      <Stack gap={5}>
        <Theme render="select" />
        <Toggle labelText="Custom colors" size="sm" bind:toggled={custom} />
        <Text>
          Hover the tile. The card follows the theme, like a Tooltip. The toggle
          overrides the annotation and card colors with custom properties.
        </Text>
      </Stack>
    </Column>
    <Column sm={4} md={4} lg={6}>
      <Tile style="padding: 1.5rem;">
        <Text type="heading-02">Hover me</Text>
      </Tile>
    </Column>
  </Row>
</Grid>

<LayoutInspector open class={custom ? "custom-inspector" : undefined} />

<style>
  /* Any CSS color works, including other Carbon tokens. */
  :global(.custom-inspector) {
    --ccs-layout-inspector-margin-fill: var(--cds-tag-background-purple);
    --ccs-layout-inspector-margin-ink: var(--cds-tag-color-purple);
    --ccs-layout-inspector-padding-fill: var(--cds-tag-background-teal);
    --ccs-layout-inspector-padding-ink: var(--cds-tag-color-teal);
    --ccs-layout-inspector-card-background: var(--cds-ui-01);
    --ccs-layout-inspector-card-text: var(--cds-text-01);
  }
</style>
