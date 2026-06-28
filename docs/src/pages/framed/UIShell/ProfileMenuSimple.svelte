<script>
  import {
    Content,
    Header,
    HeaderUtilities,
    ProfileMenu,
    ProfileMenuDivider,
    ProfileMenuHeader,
    ProfileMenuItem,
    ProfileMenuList,
    SkipToContent,
    UserAvatar,
  } from "carbon-components-svelte";
  import Logout from "carbon-icons-svelte/lib/Logout.svelte";
</script>

<Header companyName="IBM" platformName="Carbon Svelte">
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderUtilities>
    <ProfileMenu iconDescription="Profile">
      <UserAvatar
        slot="avatar"
        size="md"
        name="Monica Hall"
        backgroundColor="purple"
      />

      <ProfileMenuHeader name="Monica Hall" username="mhall" text="">
        <UserAvatar
          slot="avatar"
          size="lg"
          name="Monica Hall"
          backgroundColor="purple"
        />
      </ProfileMenuHeader>
      <ProfileMenuDivider />
      <ProfileMenuList>
        <ProfileMenuItem href="/">Settings</ProfileMenuItem>
        <ProfileMenuItem href="/">Privacy</ProfileMenuItem>
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
