<script>
  import {
    Button,
    Column,
    Grid,
    LayoutInspector,
    Row,
    Stack,
    Text,
    Tile,
  } from "carbon-components-svelte";
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
          <Text>Text on a tile: text-01 on ui-01</Text>
        </Tile>
        <div style="padding: 1rem; background: #fff1b8; color: #8a6d00;">
          Hand-picked yellow and brown: off-palette, and low contrast
        </div>
        <div
          style="padding: 1rem; background: linear-gradient(90deg, #0f62fe, #a56eff); color: #fff;"
        >
          Text on a gradient: the contrast is unknown
        </div>
        <div>
          <Button kind="secondary">Secondary button</Button>
        </div>
      </Stack>
    </Column>
  </Row>
</Grid>

<LayoutInspector open spacing={false} />
