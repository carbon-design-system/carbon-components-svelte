<script>
  import {
    Column,
    Content,
    Grid,
    GridOverlay,
    Header,
    HeaderNav,
    HeaderNavItem,
    Heading,
    Row,
    Stack,
    Text,
    Tile,
  } from "carbon-components-svelte";
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
          <Heading type="productive-heading-04">Dashboard</Heading>
          <Text>
            The header is 48px tall, so the rhythm starts at 48px. Content pads
            its top by 32px, so the heading starts on the fourth row below the
            header.
          </Text>
          <Tile style="height: 10rem;">Tile</Tile>
          <Tile style="height: 10rem;">Tile</Tile>
        </Stack>
      </Column>
    </Row>
  </Grid>
</Content>

<GridOverlay open columns={false} baseline={8} baselineOffset={48} />

<!-- docs-only:start -->
<style>
  /* The overlay is fixed to the viewport, so drop the frame's side padding
     to line the Grid up with it, and hide the frame's column guides. */
  :global(body.framed) {
    padding-inline: 0;
  }

  :global(body.framed :not(.bx--content) [class^="bx--col"]) {
    box-shadow: none;
  }
</style>
<!-- docs-only:end -->
