<script>
  import {
    Box,
    Column,
    Content,
    Grid,
    Header,
    HeaderNav,
    HeaderNavItem,
    Heading,
    Row,
    Stack,
    Text,
    Tile,
  } from "carbon-components-svelte";
  import { DevToolbar } from "carbon-components-svelte/devtools";
</script>

<Header companyName="IBM" platformName="Cloud">
  <HeaderNav>
    <HeaderNavItem href="/" text="Catalog" />
    <HeaderNavItem href="/" text="Docs" />
  </HeaderNav>
</Header>

<Content>
  <Grid>
    <Row>
      <Column>
        <Stack gap={6}>
          <Heading type="heading-04">Dashboard</Heading>
          <Text>
            Rows start below the 48px header. Measuring uses Shift, and the card
            docks in the corner.
          </Text>
          <Box height="8rem">
            <Tile fullHeight>Tile</Tile>
          </Box>
        </Stack>
      </Column>
    </Row>
  </Grid>
</Content>

<DevToolbar
  persist={false}
  tools={{
    grid: false,
    baseline: true,
    textBaselines: false,
    inspect: true,
    spacing: false,
    contrast: false,
    targets: false,
    overflow: false,
    rtl: false,
  }}
  gridProps={{ baselineOffset: 48 }}
  inspectorProps={{ measureKey: "Shift", cardPlacement: "corner" }}
/>
