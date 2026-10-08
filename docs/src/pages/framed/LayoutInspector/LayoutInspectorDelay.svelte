<script>
  import {
    Column,
    Grid,
    LayoutInspector,
    Row,
    Slider,
    Stack,
    Text,
    Tile,
  } from "carbon-components-svelte";

  let enterDelayMs = 150;
  let leaveDelayMs = 100;
  let skipDelayMs = 300;
</script>

<Grid padding>
  <Row>
    <Column sm={4} md={4} lg={6}>
      <Stack gap={5}>
        <Slider
          labelText="enterDelayMs"
          min={0}
          max={1000}
          step={50}
          bind:value={enterDelayMs}
        />
        <Slider
          labelText="leaveDelayMs"
          min={0}
          max={1000}
          step={50}
          bind:value={leaveDelayMs}
        />
        <Slider
          labelText="skipDelayMs"
          min={0}
          max={2000}
          step={100}
          bind:value={skipDelayMs}
        />
      </Stack>
    </Column>
    <Column sm={4} md={4} lg={6}>
      <Stack gap={5}>
        <Text>
          Sweep the pointer across the tiles: nothing shows until it rests. Once
          the box model shows, moving between tiles is instant. Move off into
          the page margin and back quickly, and it returns at once.
        </Text>
        {#each [1, 2, 3, 4] as n}
          <Tile>Tile {n}</Tile>
        {/each}
      </Stack>
    </Column>
  </Row>
</Grid>

<LayoutInspector open {enterDelayMs} {leaveDelayMs} {skipDelayMs} />
