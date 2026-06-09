<script lang="ts">
  import Column from "carbon-components-svelte/Grid/Column.svelte";
  import Grid from "carbon-components-svelte/Grid/Grid.svelte";
  import Row from "carbon-components-svelte/Grid/Row.svelte";
  import Content from "carbon-components-svelte/UIShell/Content.svelte";
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderAction from "carbon-components-svelte/UIShell/HeaderAction.svelte";
  import HeaderPanelDivider from "carbon-components-svelte/UIShell/HeaderPanelDivider.svelte";
  import HeaderPanelLink from "carbon-components-svelte/UIShell/HeaderPanelLink.svelte";
  import HeaderPanelLinks from "carbon-components-svelte/UIShell/HeaderPanelLinks.svelte";
  import HeaderUtilities from "carbon-components-svelte/UIShell/HeaderUtilities.svelte";
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";
  import SideNavLink from "carbon-components-svelte/UIShell/SideNavLink.svelte";
  import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
  import SideNavMenuItem from "carbon-components-svelte/UIShell/SideNavMenuItem.svelte";
  import SkipToContent from "carbon-components-svelte/UIShell/SkipToContent.svelte";

  let isSideNavOpen = false;
  let isOpen = false;
</script>

<Header companyName="IBM" platformName="Carbon Svelte" bind:isSideNavOpen>
  <div slot="skipToContent"><SkipToContent /></div>
  <HeaderUtilities>
    <HeaderAction bind:isOpen transition={false}>
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
      <Column> <h1>Welcome</h1> </Column>
    </Row>
  </Grid>
</Content>
