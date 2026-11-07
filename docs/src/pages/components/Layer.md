---
description: Layer puts content on the next Carbon surface, so fields, tiles, and borders inside it contrast with the surface below.
---

<script>
  import { Box, Layer, Search, Stack, Text, TextInput, Tile } from "carbon-components-svelte";
</script>

## Basic

Carbon stacks surfaces in up to three layers. Components read contextual tokens (`layer`, `field`, `border-subtle`, …) instead of a fixed layer, and `Layer` re-points those tokens to the next level for everything inside it. Levels count from 0, the page surface. Level 0 uses the `-01` tokens, so a field inside a level 1 `Layer` takes `field-02` and still stands out.

`Layer` works with `all.css` and with the single-theme stylesheets.

Each nested `Layer` steps up one level. Set `withBackground` to paint the layer's surface.

<Stack gap={5}>
  <TextInput labelText="Page (level 0)" placeholder="field-01" />
  <Layer withBackground>
    <Box padding={5}>
      <Stack gap={5}>
        <TextInput labelText="Level 1" placeholder="field-02" />
        <Layer withBackground>
          <Box padding={5}>
            <TextInput labelText="Level 2" placeholder="field-03" />
          </Box>
        </Layer>
      </Stack>
    </Box>
  </Layer>
</Stack>

## Tiles

A `Tile` paints the `layer` token, so a tile inside a `Layer` takes the next surface.

<Tile>
  <Stack gap={5}>
    <Text>Tile at level 0</Text>
    <Layer>
      <Tile>
        <Stack gap={5}>
          <Text>Tile at level 1</Text>
          <Layer>
            <Tile>
              <Text>Tile at level 2</Text>
            </Tile>
          </Layer>
        </Stack>
      </Tile>
    </Layer>
  </Stack>
</Tile>

## Level

Set `level` to pick a level instead of counting from the parent: `0` is the page surface, `2` the highest. Nested layers continue from it.

<Layer level={2} withBackground>
  <Box padding={5}>
    <Search placeholder="Search at level 2" />
  </Box>
</Layer>

## Modals

[Modal](/components/Modal) and [ComposedModal](/components/ComposedModal) start their own layer at level `0`, wherever they render. The modal body sits on level `1`, so fields in it take `field-02`, and a `Layer` inside the body sits on level `2`.

## Slot props

The default slot receives the layer's `level`.

<Layer withBackground let:level>
  <Box padding={5}>
    <Text>This layer is level {level}.</Text>
  </Box>
</Layer>
