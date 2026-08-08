<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderNav,
    HeaderNavItem,
    HeaderNavMenu,
    Row,
    SkipToContent,
  } from "carbon-components-svelte";
</script>

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderNav>
    <HeaderNavItem href="/catalog" text="Catalog" />
    <HeaderNavItem href="/docs" text="Docs" />
    <HeaderNavMenu text="Products" openOnHover>
      <HeaderNavItem href="/products/a" text="Product A" />
      <HeaderNavItem href="/products/b" text="Product B" />
      <HeaderNavItem href="/products/c" text="Product C" />
    </HeaderNavMenu>
    <HeaderNavMenu text="Solutions" openOnHover>
      <HeaderNavItem href="/solutions/industry" text="Industry" />
      <HeaderNavItem href="/solutions/use-cases" text="Use cases" />
    </HeaderNavMenu>
    <HeaderNavItem href="/support" text="Support" />
  </HeaderNav>
</Header>

<Content>
  <Grid>
    <Row>
      <Column> <h1>Dashboard</h1> </Column>
    </Row>
  </Grid>
</Content>
