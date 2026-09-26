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
  import Activity from "carbon-icons-svelte/lib/Activity.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import DataBase from "carbon-icons-svelte/lib/DataBase.svelte";
  import Kubernetes from "carbon-icons-svelte/lib/Kubernetes.svelte";

  let isSideNavOpen = false;
</script>

<Header companyName="IBM" platformName="Cloud" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
</Header>

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <SideNavLink icon={Dashboard} href="/" text="Dashboard" />
    <SideNavMenu icon={Kubernetes} text="Kubernetes">
      <SideNavMenuItem href="/kubernetes/clusters" text="Clusters" />
      <SideNavMenu text="Workloads">
        <SideNavMenuItem href="/kubernetes/workloads/pods" text="Pods" />
        <SideNavMenu text="Controllers">
          <SideNavMenuItem
            href="/kubernetes/workloads/controllers/deployments"
            text="Deployments"
            isSelected
          />
          <SideNavMenuItem
            href="/kubernetes/workloads/controllers/stateful-sets"
            text="Stateful sets"
          />
          <SideNavMenuItem
            href="/kubernetes/workloads/controllers/daemon-sets"
            text="Daemon sets"
          />
        </SideNavMenu>
      </SideNavMenu>
      <SideNavMenuItem href="/kubernetes/namespaces" text="Namespaces" />
    </SideNavMenu>
    <SideNavMenu icon={DataBase} text="Storage">
      <SideNavMenuItem href="/storage/volumes" text="Volumes" />
      <SideNavMenuItem href="/storage/snapshots" text="Snapshots" />
    </SideNavMenu>
    <SideNavLink icon={Activity} href="/activity" text="Activity tracker" />
  </SideNavItems>
</SideNav>

<Content>
  <Grid>
    <Row>
      <Column> <h1>Deployments</h1> </Column>
    </Row>
  </Grid>
</Content>
