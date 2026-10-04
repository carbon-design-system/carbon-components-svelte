<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderSwitcher from "carbon-components-svelte/UIShell/HeaderSwitcher.svelte";
  import HeaderUtilities from "carbon-components-svelte/UIShell/HeaderUtilities.svelte";
  import ProfileMenu from "carbon-components-svelte/UIShell/ProfileMenu.svelte";
  import ProfileMenuItem from "carbon-components-svelte/UIShell/ProfileMenuItem.svelte";
</script>

<Header companyName="IBM" platformName="Cloud">
  <HeaderUtilities>
    <HeaderSwitcher text="Acme Corp">
      <ProfileMenuItem>Acme Corp</ProfileMenuItem>
      <ProfileMenuItem>Globex</ProfileMenuItem>
    </HeaderSwitcher>
    <ProfileMenu iconDescription="Profile">
      <ProfileMenuItem href="/settings">Settings</ProfileMenuItem>
      <ProfileMenuItem>Log out</ProfileMenuItem>
    </ProfileMenu>
  </HeaderUtilities>
</Header>
