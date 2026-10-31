<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderNav,
    HeaderNavItem,
    HeaderNavMenu,
    LocalStorage,
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
  let rail = true;
  let kubernetesExpanded = false;
</script>

<LocalStorage key="sidenav-rail" bind:value={rail} />
<LocalStorage
  key="sidenav-kubernetes-expanded"
  bind:value={kubernetesExpanded}
/>

<Header companyName="IBM" platformName="Cloud" bind:isSideNavOpen>
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
</Header>

<SideNav bind:isOpen={isSideNavOpen} {rail}>
  <SideNavItems>
    <SideNavLink href="/dashboard" text="Dashboard" isSelected />
    <SideNavLink href="/resources" text="Resource list" />
    <SideNavLink href="/activity" text="Activity tracker" />
    <SideNavMenu text="Kubernetes" bind:expanded={kubernetesExpanded}>
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
