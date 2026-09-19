<script>
  import {
    Header,
    HeaderUtilities,
    ProfileMenu,
    ProfileMenuDetail,
    ProfileMenuDivider,
    ProfileMenuHeader,
    ProfileMenuItem,
  } from "carbon-components-svelte";
</script>

<Header companyName="E2E" platformName="ProfileMenu">
  <HeaderUtilities>
    <ProfileMenu iconDescription="Profile" isOpen={true}>
      <ProfileMenuHeader name="Sadek Bazaraa" username="sbazaraa" href="#" />
      <ProfileMenuDivider />
      <ProfileMenuDetail label="Plan">
        Lite
        <a slot="action" href="#">Upgrade</a>
      </ProfileMenuDetail>
      <ProfileMenuDivider />
      <ProfileMenuItem href="#">Settings</ProfileMenuItem>
      <ProfileMenuItem on:click={() => {}}>Log out</ProfileMenuItem>
    </ProfileMenu>
  </HeaderUtilities>
</Header>

<Header companyName="E2E" platformName="ProfileMenu classic" theme="classic">
  <HeaderUtilities>
    <ProfileMenu iconDescription="Profile" isOpen={true}>
      <ProfileMenuHeader name="Sadek Bazaraa" username="sbazaraa" href="#" />
      <ProfileMenuDivider />
      <ProfileMenuItem href="#">Settings</ProfileMenuItem>
    </ProfileMenu>
  </HeaderUtilities>
</Header>
