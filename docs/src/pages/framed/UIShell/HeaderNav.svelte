<script>
  import {
    Header,
    HeaderNav,
    HeaderNavItem,
    HeaderNavMenu,
    SideNav,
    SideNavItems,
    SideNavMenu,
    SideNavMenuItem,
    SideNavLink,
    SideNavDivider,
    SkipToContent,
    Content,
    Grid,
    Row,
    Column,
  } from "carbon-components-svelte";

  let isSideNavOpen = false;
</script>

<Header company="IBM" platformName="Carbon Svelte" bind:isSideNavOpen>
  <svelte:fragment slot="skip-to-content">
    <SkipToContent />
  </svelte:fragment>
  <HeaderNav>
    <HeaderNavItem href="/" text="Link 1" />
    <HeaderNavItem href="/" text="Link 2" />
    <HeaderNavItem href="/" text="Link 3" />
    <HeaderNavMenu text="Menu">
      <HeaderNavItem href="/" text="Link 1" />
      <HeaderNavItem href="/" text="Link 2" />
      <HeaderNavItem href="/" text="Link 3" />
    </HeaderNavMenu>
    <HeaderNavItem href="/" text="Link 4" />
  </HeaderNav>
</Header>

<SideNav bind:isOpen={isSideNavOpen}>
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
        <h1>Welcome</h1>
      </Column>
    </Row>
  </Grid>
</Content>
