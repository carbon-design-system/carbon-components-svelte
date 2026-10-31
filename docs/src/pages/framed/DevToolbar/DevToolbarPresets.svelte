<script>
  import {
    Box,
    Button,
    ButtonSet,
    Column,
    Grid,
    Row,
    Stack,
    Text,
  } from "carbon-components-svelte";
  import { DevToolbar } from "carbon-components-svelte/devtools";

  const none = {
    grid: false,
    baseline: false,
    textBaselines: false,
    inspect: false,
    spacing: false,
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
              (tools = { ...none, grid: true, baseline: true, spacing: true })}
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
        <Box fill="layer-01">
          <p class="sample">A box with off-scale padding and faint text.</p>
        </Box>
      </Stack>
    </Column>
  </Row>
</Grid>

<DevToolbar persist={false} bind:tools />

<style>
  /* Off the spacing scale and low contrast on purpose, for the checks.
     A plain element, since the checks skip Carbon's own components. */
  .sample {
    padding: 15px;
    color: #8d8d8d;
  }
</style>

<!-- docs-only:start -->
<svelte:head>
  <style>
    body.framed {
      padding-inline: 0;
    }

    body.framed :not(.bx--content) [class^="bx--col"] {
      box-shadow: none;
    }
  </style>
</svelte:head>
<!-- docs-only:end -->
