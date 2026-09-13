<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    Row,
    ScrollGradient,
    SideNav,
    SideNavDivider,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
  } from "carbon-components-svelte";
</script>

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
</Header>

<SideNav fixed isOpen>
  <ScrollGradient color="var(--cds-background)">
    <SideNavItems>
      <SideNavLink href="/dashboard" text="Dashboard" />
      <SideNavLink href="/resources" text="Resource list" />
      <SideNavLink href="/activity" text="Activity tracker" />
      <SideNavMenu text="Kubernetes">
        <SideNavMenuItem href="/kubernetes/clusters" text="Clusters" />
        <SideNavMenuItem href="/kubernetes/worker-pools" text="Worker pools" />
        <SideNavMenuItem
          href="/kubernetes/registry"
          text="Container registry"
        />
      </SideNavMenu>
      <SideNavDivider />
      <SideNavLink href="/object-storage" text="Object Storage" />
      <SideNavLink href="/cloud-databases" text="Cloud Databases" />
      <SideNavLink href="/cloudant" text="Cloudant" />
      <SideNavLink href="/code-engine" text="Code Engine" />
      <SideNavLink href="/cloud-functions" text="Cloud Functions" />
      <SideNavLink href="/api-gateway" text="API Gateway" />
      <SideNavLink href="/load-balancer" text="Load Balancer" />
      <SideNavLink href="/vpc" text="Virtual Private Cloud" />
      <SideNavLink href="/transit-gateway" text="Transit Gateway" />
      <SideNavLink href="/dns-services" text="DNS Services" />
      <SideNavLink href="/key-protect" text="Key Protect" />
      <SideNavLink href="/secrets-manager" text="Secrets Manager" />
      <SideNavLink href="/app-id" text="App ID" />
      <SideNavLink href="/event-streams" text="Event Streams" />
      <SideNavLink href="/watson-studio" text="Watson Studio" />
      <SideNavDivider />
      <SideNavLink href="/settings" text="Account settings" />
    </SideNavItems>
  </ScrollGradient>
</SideNav>

<Content>
  <Grid>
    <Row>
      <Column> <h1>Dashboard</h1> </Column>
    </Row>
  </Grid>
</Content>
