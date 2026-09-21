<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderGlobalAction,
    HeaderNav,
    HeaderNavItem,
    HeaderNavMenu,
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
  import Activity from "carbon-icons-svelte/lib/Activity.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Kubernetes from "carbon-icons-svelte/lib/Kubernetes.svelte";
  import ListBoxes from "carbon-icons-svelte/lib/ListBoxes.svelte";
  import Pin from "carbon-icons-svelte/lib/Pin.svelte";
  import PinFilled from "carbon-icons-svelte/lib/PinFilled.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  let rail = true;
  // A non-rail SideNav is an "open/closed" overlay: `rail=false` alone won't
  // show it. Pinning must also open it; unpinning hands isOpen back to the
  // rail (always visible) and the mobile hamburger below.
  let isOpen = false;

  function togglePin() {
    rail = !rail;
    isOpen = !rail;
  }
</script>

<Header companyName="IBM" platformName="Cloud" bind:isSideNavOpen={isOpen}>
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
    <HeaderGlobalAction
      icon={rail ? Pin : PinFilled}
      isActive={!rail}
      iconDescription={rail ? "Pin side nav open" : "Unpin side nav"}
      on:click={togglePin}
    />
  </HeaderUtilities>
</Header>

<SideNav bind:isOpen {rail}>
  <SideNavItems>
    <SideNavLink
      icon={Dashboard}
      text="Dashboard"
      href="/dashboard"
      isSelected
    />
    <SideNavLink icon={ListBoxes} text="Resource list" href="/resources" />
    <SideNavLink icon={Activity} text="Activity tracker" href="/activity" />
    <SideNavMenu icon={Kubernetes} text="Kubernetes">
      <SideNavMenuItem href="/kubernetes/clusters" text="Clusters" />
      <SideNavMenuItem href="/kubernetes/worker-pools" text="Worker pools" />
      <SideNavMenuItem href="/kubernetes/registry" text="Container registry" />
    </SideNavMenu>
    <SideNavDivider />
    <SideNavLink icon={Settings} text="Account settings" href="/settings" />
  </SideNavItems>
</SideNav>

<Content>
  <Grid>
    <Row>
      <Column> <h1>Dashboard</h1> </Column>
    </Row>
  </Grid>
</Content>
