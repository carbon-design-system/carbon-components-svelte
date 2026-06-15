<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderNav,
    HeaderNavItem,
    HeaderSideNavItems,
    Row,
    SideNav,
    SideNavItems,
    SideNavLink,
    SkipToContent,
  } from "carbon-components-svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";

  let isSideNavOpen = false;
</script>

<Header companyName="IBM" platformName="Cloud" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderNav>
    <HeaderNavItem href="/catalog" text="Catalog" />
    <HeaderNavItem href="/resources" text="Resource list" />
    <HeaderNavItem
      href="https://cloud.ibm.com/docs"
      target="_blank"
      text="Docs"
      icon={Launch}
    />
    <HeaderNavItem
      href="https://cloud.ibm.com/status"
      target="_blank"
      text="Status"
      icon={Launch}
    />
  </HeaderNav>
</Header>

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <HeaderSideNavItems hasDivider>
      <HeaderNavItem href="/catalog" text="Catalog" />
      <HeaderNavItem href="/resources" text="Resource list" />
      <HeaderNavItem
        href="https://cloud.ibm.com/docs"
        target="_blank"
        text="Docs"
        icon={Launch}
      />
      <HeaderNavItem
        href="https://cloud.ibm.com/status"
        target="_blank"
        text="Status"
        icon={Launch}
      />
    </HeaderSideNavItems>
    <SideNavLink href="/dashboard" text="Dashboard" isSelected />
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
