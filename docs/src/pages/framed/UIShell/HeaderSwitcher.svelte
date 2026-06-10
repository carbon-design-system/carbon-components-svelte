<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderAction,
    HeaderPanelDivider,
    HeaderPanelLink,
    HeaderPanelLinks,
    HeaderUtilities,
    RadioTile,
    Row,
    SideNav,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
    TileGroup,
  } from "carbon-components-svelte";
  import { expoIn } from "svelte/easing";

  let isSideNavOpen = false;
  let isOpen = false;
  let selected = "0";
  let transitions = {
    0: {
      text: "Default (duration: 200ms)",
      value: { duration: 200 },
    },
    1: {
      text: "Custom (duration: 600ms, delay: 50ms, easing: expoIn)",
      value: { duration: 600, delay: 50, easing: expoIn },
    },
    2: {
      text: "Disabled",
      value: false,
    },
  };
</script>

<Header companyName="IBM" platformName="Cloud" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderUtilities>
    <HeaderAction bind:isOpen transition={transitions[selected].value}>
      <HeaderPanelLinks>
        <HeaderPanelDivider>Switch product</HeaderPanelDivider>
        <HeaderPanelLink href="/cloud">Cloud console</HeaderPanelLink>
        <HeaderPanelLink href="/watson-studio">Watson Studio</HeaderPanelLink>
        <HeaderPanelLink href="/maximo"
          >Maximo Application Suite</HeaderPanelLink
        >
        <HeaderPanelDivider>Resources</HeaderPanelDivider>
        <HeaderPanelLink href="/docs">Documentation</HeaderPanelLink>
        <HeaderPanelLink href="/status">Status page</HeaderPanelLink>
        <HeaderPanelLink href="/community">Community</HeaderPanelLink>
      </HeaderPanelLinks>
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
          Select a transition option below and click on the App Switcher icon in
          the top right.
        </p>
        <TileGroup legendText="App switcher transitions" bind:selected>
          {#each Object.keys(transitions) as key}
            <RadioTile value={key}>{transitions[key].text}</RadioTile>
          {/each}
        </TileGroup>
      </Column>
    </Row>
  </Grid>
</Content>
