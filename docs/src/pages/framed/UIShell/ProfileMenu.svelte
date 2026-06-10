<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderGlobalAction,
    HeaderUtilities,
    ProfileMenu,
    ProfileMenuDetail,
    ProfileMenuDivider,
    ProfileMenuHeader,
    ProfileMenuItem,
    Row,
    SideNav,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
  } from "carbon-components-svelte";
  import Help from "carbon-icons-svelte/lib/Help.svelte";
  import Logout from "carbon-icons-svelte/lib/Logout.svelte";
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
    />
    <HeaderGlobalAction iconDescription="Help" icon={Help} />
    <ProfileMenu iconDescription="Profile">
      <UserAvatarFilledAlt slot="avatar" size={20} />
      <ProfileMenuHeader
        name="Richard Hendricks"
        username="rhendricks"
        href="/account/profile"
      >
        <UserAvatarFilledAlt slot="avatar" size={32} />
      </ProfileMenuHeader>
      <ProfileMenuDivider />
      <ProfileMenuDetail label="Plan">
        Lite
        <a slot="action" href="/billing/upgrade">Upgrade</a>
      </ProfileMenuDetail>
      <ProfileMenuDivider />
      <ProfileMenuDetail label="Location">
        Dallas, TX
        <a slot="action" href="/account/location">Change</a>
      </ProfileMenuDetail>
      <ProfileMenuDivider />
      <ProfileMenuItem href="/account/settings">Settings</ProfileMenuItem>
      <ProfileMenuItem href="/account/privacy">Privacy</ProfileMenuItem>
      <ProfileMenuItem href="/support/feedback">Feedback</ProfileMenuItem>
      <ProfileMenuItem href="/about">About</ProfileMenuItem>
      <ProfileMenuItem on:click={() => {}}>Change theme</ProfileMenuItem>
      <ProfileMenuDivider />
      <ProfileMenuItem on:click={() => {}}>
        Log out
        <Logout slot="icon" size={20} />
      </ProfileMenuItem>
    </ProfileMenu>
  </HeaderUtilities>
</Header>

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <SideNavLink href="/dashboard" text="Dashboard" isSelected />
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
