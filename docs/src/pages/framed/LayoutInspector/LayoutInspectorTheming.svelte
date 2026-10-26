<script>
  import {
    Box,
    Column,
    Grid,
    Row,
    Stack,
    Text,
    Theme,
    Toggle,
  } from "carbon-components-svelte";
  import { LayoutInspector } from "carbon-components-svelte/devtools";

  let custom = false;
</script>

<Grid padding>
  <Row>
    <Column sm={4} md={4} lg={6}>
      <Stack gap={5}>
        <Theme render="select" />
        <Toggle labelText="Custom colors" size="sm" bind:toggled={custom} />
        <Text>
          Hover the box. The card follows the theme, like a Popover. The toggle
          overrides the annotation colors and switches the card to the inverse
          Tooltip colors with custom properties.
        </Text>
      </Stack>
    </Column>
    <Column sm={4} md={4} lg={6}>
      <!-- The box's own padding is what the inspector paints. -->
      <Box fill="layer-01" padding={6}>
        <Text type="heading-compact-02">Hover me</Text>
      </Box>
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
    --ccs-layout-inspector-card-background: var(--cds-background-inverse);
    --ccs-layout-inspector-card-text: var(--cds-text-inverse);
    --ccs-layout-inspector-card-text-secondary: var(--cds-text-inverse);
    --ccs-layout-inspector-card-text-helper: var(--cds-text-inverse);
    --ccs-layout-inspector-card-error: var(--cds-support-error-inverse);
  }
</style>
