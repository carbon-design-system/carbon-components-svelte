<script>
  import {
    BadgeIndicator,
    Column,
    Content,
    Grid,
    Header,
    HeaderNav,
    HeaderNavItem,
    Row,
    SideNav,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
  } from "carbon-components-svelte";

  let isSideNavOpen = false;
</script>

<Header companyName="IBM" platformName="Cloud" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderNav>
    <HeaderNavItem href="/catalog" text="Catalog" />
    <HeaderNavItem href="/docs" text="Docs">
      <BadgeIndicator slot="badge" count={0} />
    </HeaderNavItem>
    <HeaderNavItem href="/support" text="Support">
      <BadgeIndicator slot="badge" count={3} />
    </HeaderNavItem>
  </HeaderNav>
</Header>

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <SideNavLink href="/dashboard" text="Dashboard" isSelected />
    <SideNavLink href="/inbox" text="Inbox">
      <BadgeIndicator slot="badge" count={4} />
    </SideNavLink>
    <SideNavLink href="/notifications" text="Notifications">
      <BadgeIndicator slot="badge" count={0} />
    </SideNavLink>
    <SideNavMenu text="Folders" expanded>
      <SideNavMenuItem href="/drafts" text="Drafts">
        <BadgeIndicator slot="badge" count={2} />
      </SideNavMenuItem>
      <SideNavMenuItem href="/archive" text="Archive" />
    </SideNavMenu>
  </SideNavItems>
</SideNav>

<Content>
  <Grid>
    <Row>
      <Column> <h1>Dashboard</h1> </Column>
    </Row>
  </Grid>
</Content>
