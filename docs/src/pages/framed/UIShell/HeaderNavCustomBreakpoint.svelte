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
  platformName="Cloud"
  bind:isSideNavOpen
  expansionBreakpoint={Number.POSITIVE_INFINITY}
>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderNav>
    <HeaderNavItem href="/catalog" text="Catalog" />
    <HeaderNavItem href="/docs" text="Docs" />
    <HeaderNavItem href="/support" text="Support" />
  </HeaderNav>
</Header>

<SideNav
  bind:isOpen={isSideNavOpen}
  expansionBreakpoint={Number.POSITIVE_INFINITY}
>
  <SideNavItems>
    <SideNavLink href="/dashboard" text="Dashboard" />
    <SideNavLink href="/resources" text="Resource list" />
    <SideNavLink href="/activity" text="Activity tracker" />
    <SideNavMenu text="Kubernetes">
      <SideNavMenuItem href="/kubernetes/clusters" text="Clusters" />
      <SideNavMenuItem href="/kubernetes/worker-pools" text="Worker pools" />
      <SideNavMenuItem href="/kubernetes/registry" text="Container registry" />
    </SideNavMenu>
    <SideNavDivider />
    <SideNavLink href="/settings" text="Account settings" />
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
