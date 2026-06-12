<script>
  import {
    BadgeIndicator,
    Column,
    Content,
    Grid,
    Header,
    HeaderGlobalAction,
    HeaderUtilities,
    Row,
    SideNav,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
  } from "carbon-components-svelte";
  import Help from "carbon-icons-svelte/lib/Help.svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
  import UserAvatarFilledAlt from "carbon-icons-svelte/lib/UserAvatarFilledAlt.svelte";

  let isSideNavOpen = false;
</script>

<Header companyName="IBM" platformName="Cloud" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderUtilities>
    <HeaderGlobalAction
      iconDescription="Notifications"
      tooltipAlignment="start"
      icon={Notification}
    >
      <BadgeIndicator slot="badge" count={4} />
    </HeaderGlobalAction>
    <HeaderGlobalAction iconDescription="Help" icon={Help}>
      <BadgeIndicator slot="badge" count={0} />
    </HeaderGlobalAction>
    <HeaderGlobalAction
      iconDescription="Profile"
      tooltipAlignment="end"
      icon={UserAvatarFilledAlt}
    />
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
      <Column> <h1>Dashboard</h1> </Column>
    </Row>
  </Grid>
</Content>
