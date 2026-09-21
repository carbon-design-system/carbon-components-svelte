<script>
  import {
    BadgeIndicator,
    Column,
    Content,
    Grid,
    Header,
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

  let isSideNavOpen = false;
</script>

<Header companyName="IBM" platformName="Cloud" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
</Header>

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <SideNavLink icon={Dashboard} href="/dashboard" text="Dashboard" isSelected>
      <BadgeIndicator slot="badge" count={3} />
    </SideNavLink>
    <SideNavLink icon={Activity} href="/activity" text="Activity tracker" />
    <SideNavMenu icon={Kubernetes} text="Kubernetes">
      <BadgeIndicator slot="badge" />
      <SideNavMenuItem href="/kubernetes/clusters" text="Clusters" />
      <SideNavMenuItem href="/kubernetes/worker-pools" text="Worker pools" />
    </SideNavMenu>
    <SideNavDivider />
  </SideNavItems>
</SideNav>

<Content>
  <Grid>
    <Row>
      <Column> <h1>Dashboard</h1> </Column>
    </Row>
  </Grid>
</Content>
