<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    Row,
    SideNav,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
  } from "carbon-components-svelte";
  import Application from "carbon-icons-svelte/lib/Application.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Kubernetes from "carbon-icons-svelte/lib/Kubernetes.svelte";
  import Renew from "carbon-icons-svelte/lib/Renew.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  let isSideNavOpen = false;
</script>

<Header companyName="IBM" platformName="Cloud" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
</Header>

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <SideNavLink icon={Dashboard} href="/" text="Dashboard" />
    <SideNavMenu icon={Kubernetes} text="Kubernetes" expanded>
      <SideNavMenuItem href="/kubernetes/clusters" text="Clusters" />
      <SideNavMenu icon={Application} text="Workloads" expanded>
        <SideNavMenuItem href="/kubernetes/workloads/pods" text="Pods" />
        <SideNavMenuItem href="/kubernetes/workloads/jobs" text="Jobs" />
      </SideNavMenu>
      <SideNavLink icon={Renew} href="/kubernetes/rollouts" text="Rollouts" />
      <SideNavMenuItem href="/kubernetes/namespaces" text="Namespaces" />
    </SideNavMenu>
    <SideNavLink icon={Settings} href="/settings" text="Settings" />
  </SideNavItems>
</SideNav>

<Content>
  <Grid>
    <Row>
      <Column> <h1>Dashboard</h1> </Column>
    </Row>
  </Grid>
</Content>
