<script>
  import {
    Box,
    Button,
    Column,
    Grid,
    Row,
    Stack,
    Text,
    Tile,
  } from "carbon-components-svelte";
  import { LayoutInspector } from "carbon-components-svelte/devtools";
</script>

<Grid padding>
  <Row>
    <Column>
      <Stack gap={5}>
        <Text>
          Hover each item. The card names each color's theme token, or says
          "off-palette", and rates the text's contrast against the background
          behind it.
        </Text>
        <Tile>
          <Text>Text on a tile: text-primary on layer-01</Text>
        </Tile>
        <Box padding={5} class="off-palette">
          Hand-picked yellow and brown: off-palette, and low contrast
        </Box>
        <Box padding={5} class="gradient">
          Text on a gradient: the contrast is unknown
        </Box>
        <div>
          <Button kind="secondary">Secondary button</Button>
        </div>
      </Stack>
    </Column>
  </Row>
</Grid>

<LayoutInspector open spacing={false} />

<style>
  /* Hand-picked colors, off the palette on purpose. */
  :global(.off-palette) {
    background: #fff1b8;
    color: #8a6d00;
  }

  :global(.gradient) {
    background: linear-gradient(90deg, #0f62fe, #a56eff);
    color: #fff;
  }
</style>
