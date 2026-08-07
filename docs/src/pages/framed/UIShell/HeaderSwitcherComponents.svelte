<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderAction,
    HeaderUtilities,
    Row,
    SideNav,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
    Switcher,
    SwitcherDivider,
    SwitcherItem,
  } from "carbon-components-svelte";

  let isSideNavOpen = false;
  let isOpen = false;
</script>

<Header companyName="IBM" platformName="Cloud" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderUtilities>
    <HeaderAction bind:isOpen>
      <Switcher aria-label="Switch product" expanded={isOpen}>
        <SwitcherItem href="/cloud" isSelected>Cloud console</SwitcherItem>
        <SwitcherItem href="/watson-studio">Watson Studio</SwitcherItem>
        <SwitcherItem href="/maximo">Maximo Application Suite</SwitcherItem>
        <SwitcherDivider />
        <SwitcherItem href="/docs">Documentation</SwitcherItem>
        <SwitcherItem href="/status">Status page</SwitcherItem>
        <SwitcherItem href="/community">Community</SwitcherItem>
      </Switcher>
    </HeaderAction>
  </HeaderUtilities>
</Header>

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <SideNavLink href="/dashboard" text="Dashboard" />
    <SideNavLink href="/resources" text="Resource list" />
    <SideNavLink href="/activity" text="Activity tracker" />
    <SideNavMenu text="Kubernetes">
      <SideNavMenuItem href="/kubernetes/clusters" text="Clusters" />
      <SideNavMenuItem href="/kubernetes/worker-pools" text="Worker pools" />
      <SideNavMenuItem href="/kubernetes/registry" text="Container registry" />
    </SideNavMenu>
  </SideNavItems>
</SideNav>

<Content>
  <Grid>
    <Row>
      <Column>
        <h1>App switcher</h1>
        <p>
          Click the App Switcher icon in the top right, then use the arrow keys
          to move between items.
        </p>
      </Column>
    </Row>
  </Grid>
</Content>
