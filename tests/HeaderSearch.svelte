<script lang="ts">
  import {
    Header,
    HeaderUtilities,
    HeaderAction,
    HeaderSearch,
    HeaderPanelLinks,
    HeaderPanelDivider,
    HeaderPanelLink,
    SideNav,
    SideNavItems,
    SideNavMenu,
    SideNavMenuItem,
    SideNavLink,
    SkipToContent,
    Content,
    Grid,
    Row,
    Column,
  } from "../types";

  let isSideNavOpen = false;
  let isOpen = false;

  let ref = null;
  let active = false;
  let value = "";
  let selectedResultIndex = 1;

  $: results =
    value.length > 2
      ? [
          {
            href: "/",
            text: "Result 1",
            description: "Result description",
          },
          {
            href: "/",
            text: "Result 2",
            description: "Result description",
          },
          {
            href: "/",
            text: "Result 3",
            description: "Result description",
          },
        ]
      : [];

  $: console.log("ref", ref);
  $: console.log("active", active);
  $: console.log("value", value);
  $: console.log("selectedResultIndex", selectedResultIndex);
</script>

<Header company="IBM" platformName="Carbon Svelte" bind:isSideNavOpen>
  <div slot="skip-to-content">
    <SkipToContent />
  </div>
  <HeaderUtilities>
    <HeaderSearch
      bind:ref
      bind:active
      bind:value
      bind:selectedResultIndex
      results="{results}"
      on:active
      on:inactive
      on:clear="{() => {
        console.log('on:clear');
      }}"
      on:select="{(e) => {
        console.log('on:select', e.detail);
      }}"
      on:paste
      let:result
      let:index
    >
      <div>{result.text}{index}</div>
    </HeaderSearch>
    <HeaderAction bind:isOpen>
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

<SideNav bind:isOpen="{isSideNavOpen}">
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
        <h1>Welcome</h1>
      </Column>
    </Row>
  </Grid>
</Content>
