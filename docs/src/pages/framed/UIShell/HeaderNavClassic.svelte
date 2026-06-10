<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderAction,
    HeaderNav,
    HeaderNavItem,
    HeaderNavMenu,
    HeaderPanelDivider,
    HeaderPanelLink,
    HeaderPanelLinks,
    HeaderUtilities,
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
  let isOpen = false;
</script>

<Header
  companyName="IBM"
  platformName="Cloud"
  theme="classic"
  bind:isSideNavOpen
>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderNav>
    <HeaderNavItem href="/catalog" text="Catalog" />
    <HeaderNavItem href="/docs" text="Docs" />
    <HeaderNavItem href="/support" text="Support" />
    <HeaderNavMenu text="Manage">
      <HeaderNavItem href="/account" text="Account" />
      <HeaderNavItem href="/iam" text="Access (IAM)" />
      <HeaderNavItem href="/billing" text="Billing and usage" />
    </HeaderNavMenu>
    <HeaderNavItem href="/status" text="Status" />
  </HeaderNav>
  <HeaderUtilities>
    <HeaderAction bind:isOpen>
      <HeaderPanelLinks>
        <HeaderPanelDivider>Switch product</HeaderPanelDivider>
        <HeaderPanelLink href="/cloud">Cloud console</HeaderPanelLink>
        <HeaderPanelDivider>Resources</HeaderPanelDivider>
        <HeaderPanelLink href="/docs">Documentation</HeaderPanelLink>
        <HeaderPanelLink href="/status">Status page</HeaderPanelLink>
        <HeaderPanelLink href="/community">Community</HeaderPanelLink>
      </HeaderPanelLinks>
    </HeaderAction>
  </HeaderUtilities>
</Header>

<SideNav theme="classic" bind:isOpen={isSideNavOpen}>
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
      <Column> <h1>Dashboard</h1> </Column>
    </Row>
  </Grid>
</Content>
