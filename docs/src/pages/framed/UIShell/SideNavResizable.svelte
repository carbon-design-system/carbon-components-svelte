<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderNav,
    HeaderNavItem,
    LocalStorage,
    Row,
    SideNav,
    SideNavItems,
    SideNavLink,
    SkipToContent,
  } from "carbon-components-svelte";
  import Activity from "carbon-icons-svelte/lib/Activity.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import ListBoxes from "carbon-icons-svelte/lib/ListBoxes.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  let width = 256;
  let lastResize = undefined;
</script>

<LocalStorage key="side-nav-width" bind:value={width} />

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderNav>
    <HeaderNavItem href="/catalog" text="Catalog" />
    <HeaderNavItem href="/docs" text="Docs" />
    <HeaderNavItem href="/support" text="Support" />
  </HeaderNav>
</Header>

<SideNav
  fixed
  isOpen
  resizable
  bind:width
  minWidth={200}
  maxWidth={480}
  on:resize={(e) => (lastResize = e.detail.width)}
>
  <SideNavItems>
    <SideNavLink
      icon={Dashboard}
      text="Dashboard"
      href="/dashboard"
      isSelected
    />
    <SideNavLink icon={ListBoxes} text="Resource list" href="/resources" />
    <SideNavLink icon={Activity} text="Activity tracker" href="/activity" />
    <SideNavLink icon={Settings} text="Account settings" href="/settings" />
  </SideNavItems>
</SideNav>

<Content>
  <Grid>
    <Row>
      <Column>
        <h1>Dashboard</h1>
        <p>Side nav width: {width}px</p>
        <p>Last resize event: {lastResize ?? "none"}</p>
      </Column>
    </Row>
  </Grid>
</Content>
