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
    SideNav,
    SideNavDivider,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
  } from "carbon-components-svelte";
  import Activity from "carbon-icons-svelte/lib/Activity.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Kubernetes from "carbon-icons-svelte/lib/Kubernetes.svelte";
  import ListBoxes from "carbon-icons-svelte/lib/ListBoxes.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  let isSideNavOpen = false;
</script>

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

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <SideNavLink
      large
      icon={Dashboard}
      href="/dashboard"
      text="Dashboard"
      isSelected
    />
    <SideNavLink
      large
      icon={ListBoxes}
      href="/resources"
      text="Resource list"
    />
    <SideNavLink
      large
      icon={Activity}
      href="/activity"
      text="Activity tracker"
    />
    <SideNavMenu large icon={Kubernetes} text="Kubernetes">
      <SideNavMenuItem href="/kubernetes/clusters" text="Clusters" />
      <SideNavMenuItem href="/kubernetes/worker-pools" text="Worker pools" />
      <SideNavMenuItem href="/kubernetes/registry" text="Container registry" />
    </SideNavMenu>
    <SideNavDivider />
    <SideNavLink
      large
      icon={Settings}
      href="/settings"
      text="Account settings"
    />
  </SideNavItems>
</SideNav>

<Content>
  <Grid>
    <Row>
      <Column> <h1>Dashboard</h1> </Column>
    </Row>
  </Grid>
</Content>
