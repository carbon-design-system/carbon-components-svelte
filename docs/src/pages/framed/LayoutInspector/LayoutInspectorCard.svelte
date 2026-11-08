<script>
  import {
    Box,
    Column,
    ContentSwitcher,
    Grid,
    Row,
    Stack,
    Switch,
    Text,
    Tile,
  } from "carbon-components-svelte";
  import { LayoutInspector } from "carbon-components-svelte/devtools";

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
        <Box height="6rem">
          <Tile fullHeight>Tile {n}</Tile>
        </Box>
      </Column>
    {/each}
  </Row>
</Grid>

<LayoutInspector open cardPlacement={placements[selectedIndex]} />
