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
        <p style="color: #a8a8a8;">Gray 40 on white fails: about 2.4:1.</p>
        <Tile>
          <p style="color: #8d8d8d; font-size: 1.5rem;">
            Large text only needs 3:1
          </p>
        </Tile>
        <Box padding={3} style="background: #f1c21b; color: #fff;">
          White on yellow fails badly
        </Box>
        <div>
          <Button disabled>Disabled controls are exempt</Button>
        </div>
      </Stack>
    </Column>
  </Row>
</Grid>

<LayoutInspector open spacing={false} contrast />
