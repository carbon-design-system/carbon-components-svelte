<script>
  import {
    BadgeIndicator,
    Column,
    Content,
    Grid,
    Header,
    HeaderNav,
    HeaderNavItem,
    HeaderNavMenu,
    HeaderSideNavItems,
    Row,
    SideNav,
    SideNavItems,
    SkipToContent,
  } from "carbon-components-svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";

  let isSideNavOpen = false;
</script>

<Header companyName="IBM" platformName="Cloud" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderNav>
    <HeaderNavItem href="/catalog" text="Catalog" isSelected />
    <HeaderNavItem href="/requests" text="Requests">
      <BadgeIndicator slot="badge" count={3} />
    </HeaderNavItem>
    <HeaderNavItem href="/changelog" text="Changelog">
      <svelte:fragment slot="badge">
        <BadgeIndicator />
        <span class="bx--visually-hidden">New entries</span>
      </svelte:fragment>
    </HeaderNavItem>
    <HeaderNavItem
      href="https://cloud.ibm.com/status"
      target="_blank"
      text="Status"
      icon={Launch}
    >
      <BadgeIndicator slot="badge" count={1} />
    </HeaderNavItem>
    <HeaderNavMenu text="Manage">
      <HeaderNavItem href="/account" text="Account" />
      <HeaderNavItem href="/access" text="Access requests">
        <BadgeIndicator slot="badge" count={12} />
      </HeaderNavItem>
      <HeaderNavItem href="/billing" text="Billing">
        <BadgeIndicator slot="badge" count="Due" />
      </HeaderNavItem>
    </HeaderNavMenu>
  </HeaderNav>
</Header>

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <HeaderSideNavItems>
      <HeaderNavItem href="/catalog" text="Catalog" isSelected />
      <HeaderNavItem href="/requests" text="Requests">
        <BadgeIndicator slot="badge" count={3} />
      </HeaderNavItem>
      <HeaderNavItem href="/changelog" text="Changelog">
        <svelte:fragment slot="badge">
          <BadgeIndicator />
          <span class="bx--visually-hidden">New entries</span>
        </svelte:fragment>
      </HeaderNavItem>
      <HeaderNavMenu text="Manage">
        <HeaderNavItem href="/account" text="Account" />
        <HeaderNavItem href="/access" text="Access requests">
          <BadgeIndicator slot="badge" count={12} />
        </HeaderNavItem>
      </HeaderNavMenu>
    </HeaderSideNavItems>
  </SideNavItems>
</SideNav>

<Content>
  <Grid>
    <Row>
      <Column>
        <h1>Header nav badges</h1>
        <p>
          Open the "Manage" menu to see badges on menu items. Narrow the window
          to see the same items in the side nav.
        </p>
      </Column>
    </Row>
  </Grid>
</Content>
