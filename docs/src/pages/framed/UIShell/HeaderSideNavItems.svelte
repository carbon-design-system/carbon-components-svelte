<script>
  import {
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
    SideNavLink,
    SkipToContent,
  } from "carbon-components-svelte";

  let isSideNavOpen = false;
</script>

<Header companyName="IBM" platformName="Cloud" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderNav>
    <HeaderNavItem href="/catalog" text="Catalog" />
    <HeaderNavItem href="/docs" text="Docs" />
    <HeaderNavItem href="/support" text="Support" />
    <HeaderNavMenu text="Manage">
      <HeaderNavItem href="/account" text="Account" />
      <HeaderNavItem href="/iam" text="Access (IAM)" />
      <HeaderNavItem href="/billing" text="Billing and usage" />
    </HeaderNavMenu>
  </HeaderNav>
</Header>

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <HeaderSideNavItems hasDivider>
      <HeaderNavItem href="/catalog" text="Catalog" />
      <HeaderNavItem href="/docs" text="Docs" />
      <HeaderNavItem href="/support" text="Support" />
      <HeaderNavMenu text="Manage">
        <HeaderNavItem href="/account" text="Account" />
        <HeaderNavItem href="/iam" text="Access (IAM)" />
        <HeaderNavItem href="/billing" text="Billing and usage" />
      </HeaderNavMenu>
    </HeaderSideNavItems>
    <SideNavLink href="/dashboard" text="Dashboard" isSelected />
    <SideNavLink href="/resources" text="Resource list" />
    <SideNavLink href="/activity" text="Activity tracker" />
  </SideNavItems>
</SideNav>

<Content>
  <Grid>
    <Row>
      <Column> <h1>Dashboard</h1> </Column>
    </Row>
  </Grid>
</Content>
