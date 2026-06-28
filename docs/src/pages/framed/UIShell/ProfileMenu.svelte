<script>
  import {
    Content,
    Header,
    HeaderUtilities,
    ProfileMenu,
    ProfileMenuDetail,
    ProfileMenuDivider,
    ProfileMenuHeader,
    ProfileMenuItem,
    ProfileMenuList,
    SkipToContent,
    UserAvatar,
  } from "carbon-components-svelte";
  import Logout from "carbon-icons-svelte/lib/Logout.svelte";

  const image = "https://i.pravatar.cc/300?img=12";
</script>

<Header companyName="IBM" platformName="Carbon Svelte">
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderUtilities>
    <ProfileMenu iconDescription="Profile">
      <UserAvatar
        slot="avatar"
        size="md"
        {image}
        imageDescription="Richard Hendricks"
      />

      <ProfileMenuHeader
        name="Richard Hendricks"
        username="rhendricks"
        href="/"
      >
        <UserAvatar
          slot="avatar"
          size="lg"
          {image}
          imageDescription="Richard Hendricks"
        />
      </ProfileMenuHeader>
      <ProfileMenuDivider />
      <ProfileMenuDetail label="Plan">
        Lite
        <a slot="action" href="/">Upgrade</a>
      </ProfileMenuDetail>
      <ProfileMenuDivider />
      <ProfileMenuDetail label="Location">
        Dallas, TX
        <a slot="action" href="/">Change</a>
      </ProfileMenuDetail>
      <ProfileMenuDivider />
      <ProfileMenuList>
        <ProfileMenuItem href="/">Settings</ProfileMenuItem>
        <ProfileMenuItem href="/">Privacy</ProfileMenuItem>
        <ProfileMenuItem href="/">Feedback</ProfileMenuItem>
        <ProfileMenuItem href="/">About</ProfileMenuItem>
        <ProfileMenuItem on:click={() => {}}>Change theme</ProfileMenuItem>
      </ProfileMenuList>
      <ProfileMenuDivider />
      <ProfileMenuList>
        <ProfileMenuItem icon={Logout} on:click={() => {}}>
          Log out
        </ProfileMenuItem>
      </ProfileMenuList>
    </ProfileMenu>
  </HeaderUtilities>
</Header>

<Content>
  <h1>Welcome</h1>
</Content>
