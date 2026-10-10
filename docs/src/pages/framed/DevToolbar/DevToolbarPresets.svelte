<script>
  import {
    Button,
    ButtonSet,
    Column,
    DevToolbar,
    Grid,
    Row,
    Stack,
    Text,
    Tile,
  } from "carbon-components-svelte";

  const none = {
    grid: false,
    baseline: false,
    textBaselines: false,
    inspect: false,
    lint: false,
    contrast: false,
    targets: false,
    overflow: false,
    rtl: false,
  };

  let tools = { ...none };
</script>

<Grid padding>
  <Row>
    <Column>
      <Stack gap={5}>
        <ButtonSet>
          <Button
            size="small"
            kind="tertiary"
            on:click={() =>
              (tools = { ...none, grid: true, baseline: true, lint: true })}
          >
            Layout review
          </Button>
          <Button
            size="small"
            kind="tertiary"
            on:click={() =>
              (tools = { ...none, contrast: true, targets: true })}
          >
            Accessibility review
          </Button>
          <Button
            size="small"
            kind="ghost"
            on:click={() => (tools = { ...none })}
          >
            Clear
          </Button>
        </ButtonSet>
        <Text>
          On:
          {Object.keys(tools)
            .filter((k) => tools[k])
            .join(", ") || "none"}
        </Text>
        <Tile style="padding: 15px;">
          <p style="color: #8d8d8d;">
            A tile with off-scale padding and faint text.
          </p>
        </Tile>
      </Stack>
    </Column>
  </Row>
</Grid>

<DevToolbar persist={false} bind:tools />

<!-- docs-only:start -->
<style>
  :global(body.framed) {
    padding-inline: 0;
  }

  :global(body.framed :not(.bx--content) [class^="bx--col"]) {
    box-shadow: none;
  }
</style>
<!-- docs-only:end -->
