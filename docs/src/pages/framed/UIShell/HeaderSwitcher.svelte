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

<Header companyName="IBM" platformName="Carbon Svelte" bind:isSideNavOpen>
  <svelte:fragment slot="skip-to-content">
    <SkipToContent />
  </svelte:fragment>
  <HeaderUtilities>
    <HeaderAction bind:isOpen transition={transitions[selected].value}>
      <HeaderPanelLinks>
        <HeaderPanelDivider>Switcher subject 1</HeaderPanelDivider>
        <HeaderPanelLink>Switcher item 1</HeaderPanelLink>
        <HeaderPanelDivider>Switcher subject 2</HeaderPanelDivider>
        <HeaderPanelLink>Switcher item 1</HeaderPanelLink>
        <HeaderPanelLink>Switcher item 2</HeaderPanelLink>
        <HeaderPanelLink>Switcher item 3</HeaderPanelLink>
        <HeaderPanelLink>Switcher item 4</HeaderPanelLink>
        <HeaderPanelLink>Switcher item 5</HeaderPanelLink>
      </HeaderPanelLinks>
    </HeaderAction>
  </HeaderUtilities>
</Header>

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <SideNavLink text="Link 1" />
    <SideNavLink text="Link 2" />
    <SideNavLink text="Link 3" />
    <SideNavMenu text="Menu">
      <SideNavMenuItem href="/" text="Link 1" />
      <SideNavMenuItem href="/" text="Link 2" />
      <SideNavMenuItem href="/" text="Link 3" />
    </SideNavMenu>
  </SideNavItems>
</SideNav>

<Content>
  <Grid>
    <Row>
      <Column>
        <h1>HeaderSwitcher</h1>
        <p>
          Select a transition option below and click on the App Switcher icon in
          the top right.
        </p>
        <TileGroup legend="App switcher transitions" bind:selected>
          {#each Object.keys(transitions) as key}
            <RadioTile value={key}>{transitions[key].text}</RadioTile>
          {/each}
        </TileGroup>
      </Column>
    </Row>
  </Grid>
</Content>
