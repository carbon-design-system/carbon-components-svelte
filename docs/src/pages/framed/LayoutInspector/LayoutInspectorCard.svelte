<script>
  import {
    Column,
    ContentSwitcher,
    Grid,
    LayoutInspector,
    Row,
    Stack,
    Switch,
    Text,
    Tile,
  } from "carbon-components-svelte";

  const placements = ["cursor", "corner"];

  let selectedIndex = 0;
</script>

<Grid padding>
  <Row>
    <Column>
      <Stack gap={5}>
        <ContentSwitcher bind:selectedIndex size="sm">
          <Switch text="cursor" />
          <Switch text="corner" />
        </ContentSwitcher>
        <Text>
          With "cursor", the card follows the pointer and flips away from the
          right and bottom edges. With "corner", it stays docked and moves aside
          when the pointer comes near.
        </Text>
      </Stack>
    </Column>
  </Row>
  <Row>
    {#each [1, 2, 3, 4] as n}
      <Column sm={2} md={2} lg={4}>
        <Tile style="height: 6rem;">Tile {n}</Tile>
      </Column>
    {/each}
  </Row>
</Grid>

<LayoutInspector open cardPlacement={placements[selectedIndex]} />
