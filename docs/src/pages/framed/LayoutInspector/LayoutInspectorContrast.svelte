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
        <Text>Body text in text-primary passes easily.</Text>
        <Text color="helper">Helper text passes too, just.</Text>
        <p class="gray-40">Gray 40 on white fails: about 2.4:1.</p>
        <Tile>
          <p class="large">Large text only needs 3:1</p>
        </Tile>
        <Box padding={3} class="white-on-yellow">
          <p>White on yellow fails badly</p>
        </Box>
        <div>
          <Button disabled>Disabled controls are exempt</Button>
        </div>
      </Stack>
    </Column>
  </Row>
</Grid>

<LayoutInspector open spacing={false} checkContrast />

<style>
  /* Low contrast on purpose, for the check to find. Plain elements, since
     the check skips Carbon's own components. */
  .gray-40 {
    color: #a8a8a8;
  }

  .large {
    color: #8d8d8d;
    font-size: 1.5rem;
  }

  :global(.white-on-yellow) {
    background: #f1c21b;
    color: #fff;
  }
</style>
