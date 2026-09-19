<script>
  import {
    Header,
    HeaderSwitcher,
    ProfileMenuItem,
    ProfileMenuList,
    UserAvatar,
  } from "carbon-components-svelte";
</script>

<Header companyName="E2E" platformName="HeaderSwitcher">
  <HeaderSwitcher text="Acme Corp" isOpen={true}>
    <svelte:fragment slot="avatar">
      <UserAvatar name="Acme Corp" backgroundColor="auto" size="sm" />
    </svelte:fragment>
    <ProfileMenuList>
      <ProfileMenuItem>Acme Corp</ProfileMenuItem>
      <ProfileMenuItem>Globex Industries</ProfileMenuItem>
    </ProfileMenuList>
  </HeaderSwitcher>
</Header>

<Header companyName="E2E" platformName="HeaderSwitcher no avatar">
  <HeaderSwitcher text="Acme Corp" isOpen={true}>
    <ProfileMenuList>
      <ProfileMenuItem>Acme Corp</ProfileMenuItem>
      <ProfileMenuItem>Globex Industries</ProfileMenuItem>
    </ProfileMenuList>
  </HeaderSwitcher>
</Header>
