<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderNav,
    HeaderNavItem,
    Row,
    SideNav,
    SideNavDivider,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
  } from "carbon-components-svelte";

  let isSideNavOpen = false;
</script>

<Header
  companyName="IBM"
  platformName="Carbon Svelte"
  bind:isSideNavOpen
  expansionBreakpoint={Infinity}
>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderNav>
    <HeaderNavItem href="/" text="Link 1" />
    <HeaderNavItem href="/" text="Link 2" />
    <HeaderNavItem href="/" text="Link 3" />
  </HeaderNav>
</Header>

<SideNav bind:isOpen={isSideNavOpen} expansionBreakpoint={Infinity}>
  <SideNavItems>
    <SideNavLink text="Link 1" />
    <SideNavLink text="Link 2" />
    <SideNavLink text="Link 3" />
    <SideNavMenu text="Menu">
      <SideNavMenuItem href="/" text="Link 1" />
      <SideNavMenuItem href="/" text="Link 2" />
      <SideNavMenuItem href="/" text="Link 3" />
    </SideNavMenu>
    <SideNavDivider />
    <SideNavLink text="Link 4" />
  </SideNavItems>
</SideNav>

<Content>
  <Grid>
    <Row>
      <Column>
        <h1>Custom Breakpoint (Infinity)</h1>
        <p>
          By default the side nav expands and the hamburger hides at 1056px and
          above. Here, the hamburger is always visible and the side nav stays
          collapsed with overlay at all viewport sizes. When opened, the overlay
          appears behind the side nav.
        </p>
      </Column>
    </Row>
  </Grid>
</Content>
